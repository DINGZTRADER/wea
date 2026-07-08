import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { FileStore, sanitizeUser } from "./store-file.mjs";
import { PostgresStore } from "./store-postgres.mjs";
import {
  clearCookie,
  createCsrfToken,
  generateId,
  hashPassword,
  parseCookies,
  sessionCookie,
  signSession,
  verifyPassword,
  verifySession,
} from "./security.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const IS_PRODUCTION = process.env.NODE_ENV === "production" || process.argv.includes("--serve-static");
const PORT = Number(process.env.PORT || 4000);
const SESSION_COOKIE = "wea_session";
const SESSION_MAX_AGE = 60 * 60 * 8;
const SESSION_SECRET = process.env.SESSION_SECRET || "development-only-change-this-session-secret";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (IS_PRODUCTION && SESSION_SECRET.includes("development-only")) {
  throw new Error("SESSION_SECRET must be set to a strong random value in production.");
}

const store = process.env.DATABASE_URL
  ? new PostgresStore(process.env.DATABASE_URL)
  : new FileStore();

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

function sendJson(res, statusCode, payload, headers = {}) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(JSON.stringify(payload));
}

function sendError(res, statusCode, message) {
  sendJson(res, statusCode, { error: message });
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("Invalid JSON body.");
    error.statusCode = 400;
    throw error;
  }
}

function validateString(value, name, max = 200) {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > max) {
    const error = new Error(`${name} is invalid.`);
    error.statusCode = 400;
    throw error;
  }
  return value.trim();
}

function validateAmount(value, name = "Amount") {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000_000) {
    const error = new Error(`${name} is invalid.`);
    error.statusCode = 400;
    throw error;
  }
  return Math.round(amount);
}

function validateDate(value, name) {
  const date = validateString(value, name, 20);
  if (Number.isNaN(Date.parse(date))) {
    const error = new Error(`${name} must be a valid date.`);
    error.statusCode = 400;
    throw error;
  }
  return date;
}

async function getSession(req) {
  const cookies = parseCookies(req.headers.cookie);
  const payload = verifySession(cookies[SESSION_COOKIE], SESSION_SECRET);
  if (!payload?.userId || !payload?.tenantId) return null;
  const user = await store.findUserById(payload.userId);
  if (!user || user.tenantId !== payload.tenantId) return null;
  return {
    user: sanitizeUser(user),
    csrfToken: payload.csrfToken,
  };
}

function requireCsrf(req, session) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;
  const provided = req.headers["x-csrf-token"];
  if (!provided || provided !== session.csrfToken) {
    const error = new Error("Security check failed. Refresh and sign in again.");
    error.statusCode = 403;
    throw error;
  }
}

async function requireAuth(req) {
  const session = await getSession(req);
  if (!session) {
    const error = new Error("Authentication required.");
    error.statusCode = 401;
    throw error;
  }
  requireCsrf(req, session);
  return session;
}

function buildSession(user) {
  const csrfToken = createCsrfToken();
  const token = signSession(
    {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      csrfToken,
    },
    SESSION_SECRET,
    SESSION_MAX_AGE,
  );
  return { csrfToken, token };
}

async function handleAuth(req, res, pathname) {
  if (req.method === "GET" && pathname === "/api/session") {
    const session = await getSession(req);
    if (!session) {
      const needsBootstrap = !(await store.hasUsers());
      return sendJson(res, 200, { authenticated: false, needsBootstrap });
    }
    return sendJson(res, 200, {
      authenticated: true,
      user: session.user,
      csrfToken: session.csrfToken,
    });
  }

  if (req.method === "POST" && pathname === "/api/auth/bootstrap") {
    if (await store.hasUsers()) return sendError(res, 409, "Initial account already exists.");
    const body = await readJson(req);
    const email = validateString(body.email, "Email", 254).toLowerCase();
    const name = validateString(body.name || "Owner", "Name", 120);
    const passwordHash = await hashPassword(validateString(body.password, "Password", 200));
    const user = await store.createInitialUser({ email, name, passwordHash });
    const session = buildSession(user);
    return sendJson(
      res,
      201,
      { user, csrfToken: session.csrfToken },
      { "Set-Cookie": sessionCookie(SESSION_COOKIE, session.token, { maxAgeSeconds: SESSION_MAX_AGE, secure: IS_PRODUCTION }) },
    );
  }

  if (req.method === "POST" && pathname === "/api/auth/login") {
    const body = await readJson(req);
    const email = validateString(body.email, "Email", 254).toLowerCase();
    const password = validateString(body.password, "Password", 200);
    const userRecord = await store.findUserByEmail(email);
    if (!userRecord || !(await verifyPassword(password, userRecord.passwordHash))) {
      return sendError(res, 401, "Invalid email or password.");
    }
    const user = sanitizeUser(userRecord);
    const session = buildSession(user);
    return sendJson(
      res,
      200,
      { user, csrfToken: session.csrfToken },
      { "Set-Cookie": sessionCookie(SESSION_COOKIE, session.token, { maxAgeSeconds: SESSION_MAX_AGE, secure: IS_PRODUCTION }) },
    );
  }

  if (req.method === "POST" && pathname === "/api/auth/logout") {
    return sendJson(
      res,
      200,
      { ok: true },
      { "Set-Cookie": clearCookie(SESSION_COOKIE, { secure: IS_PRODUCTION }) },
    );
  }

  return false;
}

async function handleAppApi(req, res, pathname) {
  const session = await requireAuth(req);
  const tenantId = session.user.tenantId;

  if (req.method === "GET" && pathname === "/api/app-state") {
    return sendJson(res, 200, await store.getAppState(tenantId));
  }

  if (req.method === "PATCH" && pathname === "/api/invoice-settings") {
    const body = await readJson(req);
    const settings = {
      logo: typeof body.logo === "string" && body.logo.length < 2_000_000 ? body.logo : undefined,
      primaryColor: /^#[0-9a-f]{6}$/i.test(body.primaryColor) ? body.primaryColor : "#2563eb",
      footerText: validateString(body.footerText, "Footer text", 500),
      showPaymentInstructions: Boolean(body.showPaymentInstructions),
    };
    return sendJson(res, 200, await store.setInvoiceSettings(tenantId, settings));
  }

  if (req.method === "POST" && pathname === "/api/categories") {
    const body = await readJson(req);
    const category = {
      id: generateId("cat"),
      name: validateString(body.name, "Category name", 80),
      color: /^#[0-9a-f]{6}$/i.test(body.color) ? body.color : "#3b82f6",
    };
    return sendJson(res, 201, await store.addCategory(tenantId, category));
  }

  if (req.method === "PATCH" && pathname.startsWith("/api/categories/")) {
    const id = pathname.split("/").pop();
    const body = await readJson(req);
    const category = {
      id,
      name: validateString(body.name, "Category name", 80),
      color: /^#[0-9a-f]{6}$/i.test(body.color) ? body.color : "#3b82f6",
    };
    return sendJson(res, 200, await store.updateCategory(tenantId, category));
  }

  if (req.method === "DELETE" && pathname.startsWith("/api/categories/")) {
    await store.deleteCategory(tenantId, pathname.split("/").pop());
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "POST" && pathname === "/api/expenses") {
    const body = await readJson(req);
    const expense = {
      id: generateId("exp"),
      projectId: validateString(body.projectId, "Project", 120),
      invoiceId: typeof body.invoiceId === "string" && body.invoiceId ? body.invoiceId : undefined,
      categoryId: validateString(body.categoryId, "Category", 120),
      amount: validateAmount(body.amount),
      description: validateString(body.description, "Description", 240),
      date: validateDate(body.date, "Expense date"),
    };
    return sendJson(res, 201, await store.addExpense(tenantId, expense));
  }

  if (req.method === "DELETE" && pathname.startsWith("/api/expenses/")) {
    await store.deleteExpense(tenantId, pathname.split("/").pop());
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "POST" && pathname === "/api/payments") {
    const body = await readJson(req);
    const payment = {
      id: generateId("pay"),
      invoiceId: validateString(body.invoiceId, "Invoice", 120),
      amount: validateAmount(body.amount),
      method: validateString(body.method, "Payment method", 80),
      date: validateDate(body.date, "Payment date"),
      reference: typeof body.reference === "string" ? body.reference.trim().slice(0, 160) : "",
    };
    return sendJson(res, 201, await store.recordPayment(tenantId, payment));
  }

  return false;
}

async function handleAiApi(req, res, pathname) {
  const session = await requireAuth(req);
  if (!ai) return sendError(res, 503, "Gemini API key is not configured on the server.");

  if (req.method === "POST" && pathname === "/api/ai/decision") {
    const state = await store.getAppState(session.user.tenantId);
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_DECISION_MODEL || "gemini-3-pro-preview",
      contents: `You are WEA-Ops, the Autonomous Operations Manager for WachaExperience-AI (U) Ltd.
Review this tenant's current business state. Currency values are Uganda Shillings (UGX).
Clients: ${JSON.stringify(state.clients)}
Projects: ${JSON.stringify(state.projects)}
Deliverables: ${JSON.stringify(state.deliverables)}
Invoices: ${JSON.stringify(state.invoices)}

Identify the most critical action to take today. Consider overdue invoices, partial payments, approaching deliverable deadlines, client sentiment risks, and project velocity.
Respond only as JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            escalated: { type: Type.BOOLEAN },
          },
          required: ["action", "reasoning", "confidence", "escalated"],
        },
      },
    });
    const parsed = JSON.parse(response.text || "{}");
    const log = {
      id: generateId("log"),
      timestamp: new Date().toISOString(),
      action: String(parsed.action || "Review operations"),
      reasoning: String(parsed.reasoning || "No reasoning returned."),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence || 0))),
      escalated: Boolean(parsed.escalated),
    };
    return sendJson(res, 201, await store.addAiLog(session.user.tenantId, log));
  }

  if (req.method === "POST" && pathname === "/api/ai/chat") {
    const body = await readJson(req);
    const userMessage = validateString(body.message, "Message", 2000);
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_CHAT_MODEL || "gemini-3-flash-preview",
      contents: userMessage,
      config: {
        systemInstruction: `You are the AI Sales Assistant for WachaExperience-AI (U) Ltd (WEA).
We build websites, apps, automations, and AI-enabled digital systems.
Contact: 0774 178 738, 0704 650 600. Email: wachaexperience@gmail.com.
Currency: Uganda Shillings (UGX). Pricing starts from UGX 1,500,000 for smaller projects and scales by scope.
Be concise, practical, professional, and ask for lead contact details when buying intent is clear.`,
      },
    });
    return sendJson(res, 200, { text: response.text || "I'm sorry, I could not process that right now." });
  }

  if (req.method === "POST" && pathname === "/api/ai/speech") {
    const body = await readJson(req);
    const text = validateString(body.text, "Speech text", 1200);
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say clearly and professionally: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Charon" },
          },
        },
      },
    });
    return sendJson(res, 200, { audio: response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data });
  }

  return false;
}

async function serveStatic(req, res, pathname) {
  const cleanPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(DIST_DIR, cleanPath));
  if (!filePath.startsWith(DIST_DIR)) return sendError(res, 403, "Forbidden.");
  try {
    const content = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    const contentTypes = {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".jpg": "image/jpeg",
    };
    res.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    });
    res.end(content);
  } catch {
    if (!pathname.startsWith("/api/")) {
      const index = await fs.readFile(path.join(DIST_DIR, "index.html"));
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(index);
    }
    sendError(res, 404, "Not found.");
  }
}

async function requestHandler(req, res) {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = url.pathname;

    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Headers": "Content-Type, X-CSRF-Token",
        "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
      });
      return res.end();
    }

    const authResult = await handleAuth(req, res, pathname);
    if (authResult !== false) return;

    if (pathname.startsWith("/api/ai/")) {
      const result = await handleAiApi(req, res, pathname);
      if (result !== false) return;
    }

    if (pathname.startsWith("/api/")) {
      const result = await handleAppApi(req, res, pathname);
      if (result !== false) return;
      return sendError(res, 404, "API route not found.");
    }

    if (IS_PRODUCTION) return serveStatic(req, res, pathname);
    return sendError(res, 404, "API server is running. Use Vite for the frontend in development.");
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if (statusCode >= 500) console.error(error);
    sendError(res, statusCode, statusCode >= 500 ? "Internal server error." : error.message);
  }
}

await store.init();

http.createServer(requestHandler).listen(PORT, () => {
  const mode = process.env.DATABASE_URL ? "PostgreSQL" : "local file database";
  console.log(`WEA API listening on http://localhost:${PORT} using ${mode}`);
});
