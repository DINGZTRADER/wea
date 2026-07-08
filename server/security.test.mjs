import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, signSession, verifyPassword, verifySession } from "./security.mjs";

test("password hashes verify the original password only", async () => {
  const hash = await hashPassword("commercial-grade-passphrase");

  assert.equal(await verifyPassword("commercial-grade-passphrase", hash), true);
  assert.equal(await verifyPassword("wrong-passphrase", hash), false);
  assert.notEqual(hash, "commercial-grade-passphrase");
});

test("signed sessions reject tampered payloads", () => {
  const secret = "test-secret-with-enough-entropy";
  const token = signSession({ userId: "usr_1", tenantId: "tenant_1" }, secret, 60);
  const [payload, signature] = token.split(".");
  const tampered = `${Buffer.from(JSON.stringify({ userId: "usr_2", tenantId: "tenant_1", exp: 9999999999 })).toString("base64url")}.${signature}`;

  assert.equal(verifySession(token, secret)?.userId, "usr_1");
  assert.equal(verifySession(tampered, secret), null);
  assert.equal(verifySession(`${payload}.invalid`, secret), null);
});
