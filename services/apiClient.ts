import { AIActionLog, Expense, ExpenseCategory, InvoiceTemplateSettings, Payment } from "../types";

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
}

export interface SessionResponse {
  authenticated: boolean;
  needsBootstrap?: boolean;
  user?: AuthUser;
  csrfToken?: string;
}

let csrfToken = "";

export function setCsrfToken(token?: string) {
  csrfToken = token || "";
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = options.method || "GET";
  const headers = new Headers(options.headers);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  if (!["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase()) && csrfToken) {
    headers.set("X-CSRF-Token", csrfToken);
  }

  try {
    const response = await fetch(path, {
      ...options,
      method,
      headers,
      credentials: "include",
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || `Request failed with ${response.status}`);
    }
    return payload as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The secure API did not respond in time.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export const api = {
  session: () => apiFetch<SessionResponse>("/api/session"),
  bootstrap: (body: { email: string; name: string; password: string }) =>
    apiFetch<{ user: AuthUser; csrfToken: string }>("/api/auth/bootstrap", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    apiFetch<{ user: AuthUser; csrfToken: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  logout: () => apiFetch<{ ok: true }>("/api/auth/logout", { method: "POST" }),
  appState: <T>() => apiFetch<T>("/api/app-state"),
  updateInvoiceSettings: (settings: InvoiceTemplateSettings) =>
    apiFetch<InvoiceTemplateSettings>("/api/invoice-settings", {
      method: "PATCH",
      body: JSON.stringify(settings),
    }),
  addCategory: (category: Pick<ExpenseCategory, "name" | "color">) =>
    apiFetch<ExpenseCategory>("/api/categories", {
      method: "POST",
      body: JSON.stringify(category),
    }),
  updateCategory: (category: ExpenseCategory) =>
    apiFetch<ExpenseCategory>(`/api/categories/${encodeURIComponent(category.id)}`, {
      method: "PATCH",
      body: JSON.stringify(category),
    }),
  deleteCategory: (id: string) =>
    apiFetch<{ ok: true }>(`/api/categories/${encodeURIComponent(id)}`, { method: "DELETE" }),
  addExpense: (expense: Omit<Expense, "id">) =>
    apiFetch<Expense>("/api/expenses", {
      method: "POST",
      body: JSON.stringify(expense),
    }),
  deleteExpense: (id: string) =>
    apiFetch<{ ok: true }>(`/api/expenses/${encodeURIComponent(id)}`, { method: "DELETE" }),
  recordPayment: (payment: Omit<Payment, "id">) =>
    apiFetch<{ payment: Payment; invoice: { id: string; receivedAmount: number; status: string } }>("/api/payments", {
      method: "POST",
      body: JSON.stringify(payment),
    }),
  aiDecision: () => apiFetch<AIActionLog>("/api/ai/decision", { method: "POST" }),
  aiChat: (message: string) =>
    apiFetch<{ text: string }>("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  aiSpeech: (text: string) =>
    apiFetch<{ audio?: string }>("/api/ai/speech", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
};
