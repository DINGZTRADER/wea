import fs from "node:fs/promises";
import path from "node:path";
import { INITIAL_STATE } from "./seed-data.mjs";
import { generateId } from "./security.mjs";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "wea.local.json");
const DEFAULT_TENANT_ID = "tenant_default";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function defaultDatabase() {
  return {
    tenants: [{ id: DEFAULT_TENANT_ID, name: "WachaExperience-AI (U) Ltd", createdAt: new Date().toISOString() }],
    users: [],
    tenantState: {
      [DEFAULT_TENANT_ID]: clone(INITIAL_STATE),
    },
  };
}

async function readDatabase() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const db = defaultDatabase();
    await writeDatabase(db);
    return db;
  }
}

async function writeDatabase(db) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tempFile = `${DATA_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(db, null, 2));
  await fs.rename(tempFile, DATA_FILE);
}

function getTenantState(db, tenantId) {
  if (!db.tenantState[tenantId]) db.tenantState[tenantId] = clone(INITIAL_STATE);
  return db.tenantState[tenantId];
}

export class FileStore {
  async init() {
    await readDatabase();
  }

  async hasUsers() {
    const db = await readDatabase();
    return db.users.length > 0;
  }

  async createInitialUser({ email, name, passwordHash }) {
    const db = await readDatabase();
    if (db.users.length > 0) throw new Error("Initial account already exists.");
    const user = {
      id: generateId("usr"),
      tenantId: DEFAULT_TENANT_ID,
      email: email.toLowerCase(),
      name,
      passwordHash,
      role: "owner",
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    await writeDatabase(db);
    return sanitizeUser(user);
  }

  async findUserByEmail(email) {
    const db = await readDatabase();
    return db.users.find((user) => user.email === email.toLowerCase()) || null;
  }

  async findUserById(id) {
    const db = await readDatabase();
    return db.users.find((user) => user.id === id) || null;
  }

  async getAppState(tenantId) {
    const db = await readDatabase();
    return clone(getTenantState(db, tenantId));
  }

  async setInvoiceSettings(tenantId, settings) {
    const db = await readDatabase();
    getTenantState(db, tenantId).invoiceSettings = settings;
    await writeDatabase(db);
    return settings;
  }

  async addCategory(tenantId, category) {
    const db = await readDatabase();
    const state = getTenantState(db, tenantId);
    state.categories.push(category);
    await writeDatabase(db);
    return category;
  }

  async updateCategory(tenantId, category) {
    const db = await readDatabase();
    const state = getTenantState(db, tenantId);
    state.categories = state.categories.map((item) => (item.id === category.id ? category : item));
    await writeDatabase(db);
    return category;
  }

  async deleteCategory(tenantId, categoryId) {
    const db = await readDatabase();
    const state = getTenantState(db, tenantId);
    if (state.expenses.some((expense) => expense.categoryId === categoryId)) {
      const error = new Error("Category is in use.");
      error.statusCode = 409;
      throw error;
    }
    state.categories = state.categories.filter((category) => category.id !== categoryId);
    await writeDatabase(db);
  }

  async addExpense(tenantId, expense) {
    const db = await readDatabase();
    const state = getTenantState(db, tenantId);
    state.expenses.unshift(expense);
    await writeDatabase(db);
    return expense;
  }

  async deleteExpense(tenantId, expenseId) {
    const db = await readDatabase();
    const state = getTenantState(db, tenantId);
    state.expenses = state.expenses.filter((expense) => expense.id !== expenseId);
    await writeDatabase(db);
  }

  async recordPayment(tenantId, payment) {
    const db = await readDatabase();
    const state = getTenantState(db, tenantId);
    const invoice = state.invoices.find((item) => item.id === payment.invoiceId);
    if (!invoice) {
      const error = new Error("Invoice not found.");
      error.statusCode = 404;
      throw error;
    }
    const receivedAmount = invoice.receivedAmount + payment.amount;
    invoice.receivedAmount = receivedAmount;
    invoice.status = receivedAmount >= invoice.amount ? "Paid" : "Partial";
    state.payments.push(payment);
    await writeDatabase(db);
    return { payment, invoice };
  }

  async addAiLog(tenantId, log) {
    const db = await readDatabase();
    const state = getTenantState(db, tenantId);
    state.aiLogs.unshift(log);
    state.aiLogs = state.aiLogs.slice(0, 200);
    await writeDatabase(db);
    return log;
  }
}

export function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
