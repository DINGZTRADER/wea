import { INITIAL_STATE } from "./seed-data.mjs";
import { generateId } from "./security.mjs";
import { sanitizeUser } from "./store-file.mjs";

const DEFAULT_TENANT_ID = "tenant_default";

export class PostgresStore {
  constructor(databaseUrl) {
    this.databaseUrl = databaseUrl;
    this.pool = null;
  }

  async init() {
    const { Pool } = await import("pg");
    this.pool = new Pool({
      connectionString: this.databaseUrl,
      ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
      max: Number(process.env.DATABASE_POOL_SIZE || 10),
      idleTimeoutMillis: 30000,
    });
    await this.migrate();
  }

  async query(text, params = []) {
    return this.pool.query(text, params);
  }

  async migrate() {
    await this.query(`
      create table if not exists tenants (
        id text primary key,
        name text not null,
        created_at timestamptz not null default now()
      );

      create table if not exists users (
        id text primary key,
        tenant_id text not null references tenants(id) on delete cascade,
        email text not null unique,
        name text not null,
        password_hash text not null,
        role text not null default 'member',
        created_at timestamptz not null default now()
      );

      create table if not exists app_state (
        tenant_id text primary key references tenants(id) on delete cascade,
        payload jsonb not null,
        updated_at timestamptz not null default now()
      );

      insert into tenants (id, name)
      values ($1, 'WachaExperience-AI (U) Ltd')
      on conflict (id) do nothing;

      insert into app_state (tenant_id, payload)
      values ($1, $2::jsonb)
      on conflict (tenant_id) do nothing;
    `, [DEFAULT_TENANT_ID, JSON.stringify(INITIAL_STATE)]);
  }

  async hasUsers() {
    const result = await this.query("select 1 from users limit 1");
    return result.rowCount > 0;
  }

  async createInitialUser({ email, name, passwordHash }) {
    const hasUsers = await this.hasUsers();
    if (hasUsers) throw new Error("Initial account already exists.");
    const result = await this.query(
      `insert into users (id, tenant_id, email, name, password_hash, role)
       values ($1, $2, $3, $4, $5, 'owner')
       returning id, tenant_id as "tenantId", email, name, password_hash as "passwordHash", role`,
      [generateId("usr"), DEFAULT_TENANT_ID, email.toLowerCase(), name, passwordHash],
    );
    return sanitizeUser(result.rows[0]);
  }

  async findUserByEmail(email) {
    const result = await this.query(
      `select id, tenant_id as "tenantId", email, name, password_hash as "passwordHash", role
       from users where email = $1`,
      [email.toLowerCase()],
    );
    return result.rows[0] || null;
  }

  async findUserById(id) {
    const result = await this.query(
      `select id, tenant_id as "tenantId", email, name, password_hash as "passwordHash", role
       from users where id = $1`,
      [id],
    );
    return result.rows[0] || null;
  }

  async getAppState(tenantId) {
    const result = await this.query("select payload from app_state where tenant_id = $1", [tenantId]);
    return result.rows[0]?.payload || INITIAL_STATE;
  }

  async updateState(tenantId, updater) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const current = await client.query("select payload from app_state where tenant_id = $1 for update", [tenantId]);
      const state = current.rows[0]?.payload || structuredClone(INITIAL_STATE);
      const result = await updater(state);
      await client.query(
        "update app_state set payload = $2::jsonb, updated_at = now() where tenant_id = $1",
        [tenantId, JSON.stringify(state)],
      );
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async setInvoiceSettings(tenantId, settings) {
    return this.updateState(tenantId, (state) => {
      state.invoiceSettings = settings;
      return settings;
    });
  }

  async addCategory(tenantId, category) {
    return this.updateState(tenantId, (state) => {
      state.categories.push(category);
      return category;
    });
  }

  async updateCategory(tenantId, category) {
    return this.updateState(tenantId, (state) => {
      state.categories = state.categories.map((item) => (item.id === category.id ? category : item));
      return category;
    });
  }

  async deleteCategory(tenantId, categoryId) {
    return this.updateState(tenantId, (state) => {
      if (state.expenses.some((expense) => expense.categoryId === categoryId)) {
        const error = new Error("Category is in use.");
        error.statusCode = 409;
        throw error;
      }
      state.categories = state.categories.filter((category) => category.id !== categoryId);
    });
  }

  async addExpense(tenantId, expense) {
    return this.updateState(tenantId, (state) => {
      state.expenses.unshift(expense);
      return expense;
    });
  }

  async deleteExpense(tenantId, expenseId) {
    return this.updateState(tenantId, (state) => {
      state.expenses = state.expenses.filter((expense) => expense.id !== expenseId);
    });
  }

  async recordPayment(tenantId, payment) {
    return this.updateState(tenantId, (state) => {
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
      return { payment, invoice };
    });
  }

  async addAiLog(tenantId, log) {
    return this.updateState(tenantId, (state) => {
      state.aiLogs.unshift(log);
      state.aiLogs = state.aiLogs.slice(0, 200);
      return log;
    });
  }
}
