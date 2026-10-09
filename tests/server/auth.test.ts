import { createHash, randomBytes } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { bootstrapCsrf, login, logout, provisionOwner, requireBuyerMutation, requireBuyerRead, requireOwnerMutation, requireOwnerRead } from "../../src/server/auth";
import { getConfig } from "../../src/server/config";
import type { HttpContext } from "../../src/server/context";
import { openDatabase } from "../../src/server/db";

const password = "correct-password-12345";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
let db: DatabaseSync;
let ownerRow: Record<string, unknown>;
let now: number;

function context(headers: Record<string, string> = {}, method = "GET", url = "http://127.0.0.1:3000/api/session"): HttpContext {
  return { request: new Request(url, { method, headers: { host: "127.0.0.1:3000", ...headers } }), db, config: getConfig({ NODE_ENV: "test" }), now: () => now, responseHeaders: new Headers() };
}

function cookies(ctx: HttpContext): string {
  return ctx.responseHeaders.getSetCookie().map((value) => value.split(";")[0]).join("; ");
}

function anonymous(): { cookie: string; csrf: string } {
  const ctx = context();
  const result = bootstrapCsrf(ctx);
  return { cookie: cookies(ctx), csrf: result.csrfToken };
}

async function authenticated() {
  const session = anonymous();
  const ctx = context({ cookie: session.cookie, origin: "http://127.0.0.1:3000", "x-csrf-token": session.csrf }, "POST");
  const result = await login(ctx, { username: "owner", password });
  return { cookie: cookies(ctx), csrf: result.csrfToken };
}

beforeAll(async () => {
  const seed = openDatabase(":memory:");
  await provisionOwner(seed, "owner", password, 1000);
  ownerRow = seed.prepare("SELECT * FROM owners").get()!;
  seed.close();
});

beforeEach(() => {
  db = openDatabase(":memory:");
  now = 1000;
  db.prepare("INSERT INTO owners VALUES (?, ?, ?, ?, ?, ?)").run(...Object.values(ownerRow) as (string | number)[]);
});
afterEach(() => db.close());

describe("opaque owner sessions and CSRF", () => {
  it("uses real scrypt exact parameters, 16-byte salt, 64-byte hash, no plaintext", () => {
    expect(JSON.parse(ownerRow.scrypt_params as string)).toEqual({ N: 131072, r: 8, p: 1, maxmem: 268435456 });
    expect(Buffer.from(ownerRow.password_salt as string, "hex")).toHaveLength(16);
    expect(Buffer.from(ownerRow.password_hash as string, "hex")).toHaveLength(64);
    expect(JSON.stringify(ownerRow)).not.toContain(password);
  });

  it("bootstraps 32-byte anonymous tokens for 15 minutes, reuses valid session", () => {
    const ctx = context();
    const result = bootstrapCsrf(ctx);
    const cookie = cookies(ctx);
    const token = /scope_session=([^;]+)/.exec(cookie)![1];
    expect(Buffer.from(token, "base64url")).toHaveLength(32);
    expect(Buffer.from(result.csrfToken, "base64url")).toHaveLength(32);
    expect(db.prepare("SELECT * FROM sessions").get()).toEqual({ token_hash: hash(token), owner_id: null, csrf_hash: hash(result.csrfToken), expires_at: now + 15 * 60 * 1000 });
    expect(ctx.responseHeaders.getSetCookie()[0]).toContain("HttpOnly");
    expect(ctx.responseHeaders.getSetCookie()[0]).toContain("SameSite=Strict");
    expect(ctx.responseHeaders.getSetCookie()[0]).not.toContain("Secure");
    expect(bootstrapCsrf(context({ cookie }))).toEqual(result);
    now += 15 * 60 * 1000;
    expect(bootstrapCsrf(context({ cookie })).csrfToken).not.toBe(result.csrfToken);
    expect(db.prepare("SELECT COUNT(*) AS count FROM sessions").get()).toEqual({ count: 1 });
  });

  it("rotates session/CSRF on login, expires after 8 hours, logout invalidates", async () => {
    const previous = anonymous();
    const ctx = context({ cookie: previous.cookie, origin: "http://127.0.0.1:3000", "x-csrf-token": previous.csrf }, "POST");
    const result = await login(ctx, { username: "owner", password });
    const cookie = cookies(ctx);
    expect(result.authenticated).toBe(true);
    expect(result.csrfToken).not.toBe(previous.csrf);
    expect(cookie).not.toBe(previous.cookie);
    expect(() => requireOwnerRead(context({ cookie: previous.cookie }))).toThrow();
    expect(requireOwnerRead(context({ cookie })).ownerId).toBe(ownerRow.id);
    expect(db.prepare("SELECT expires_at FROM sessions").get()).toEqual({ expires_at: now + 8 * 60 * 60 * 1000 });
    const logoutCtx = context({ cookie, origin: "http://127.0.0.1:3000", "x-csrf-token": result.csrfToken }, "DELETE");
    expect(logout(logoutCtx).authenticated).toBe(false);
    expect(() => requireOwnerRead(context({ cookie }))).toThrow();
    expect(db.prepare("SELECT COUNT(*) AS count FROM sessions WHERE owner_id IS NOT NULL").get()).toEqual({ count: 0 });
    expect(logoutCtx.responseHeaders.getSetCookie().join(";")).toContain("Max-Age=0");
  });

  it("denies 10 auth bypass requests with zero owner disclosures", async () => {
    const owner = await authenticated();
    const anon = anonymous();
    const forged = randomBytes(32).toString("base64url");
    const cases = [
      context(), context({ cookie: `scope_session=${forged}` }), context({ cookie: anon.cookie }),
      context({ cookie: "scope_session=short" }), context({ cookie: `${owner.cookie}; scope_session=${forged}` }),
      context({ cookie: owner.cookie, host: "evil.example" }), context({ cookie: owner.cookie, origin: "https://evil.example" }),
      context({ cookie: owner.cookie, "x-checkout-token": forged, host: "localhost:3000" }),
      context({ cookie: "scope_session=%ZZ" }), context({ "x-checkout-token": forged }),
    ];
    for (const ctx of cases) expect(() => requireOwnerRead(ctx)).toThrow();
    now += 8 * 60 * 60 * 1000;
    expect(() => requireOwnerRead(context({ cookie: owner.cookie }))).toThrow();
  });

  it("denies 10 mutation CSRF/Origin bypasses, accepts exact Host/Origin/token", async () => {
    const owner = await authenticated();
    const valid = { cookie: owner.cookie, origin: "http://127.0.0.1:3000", "x-csrf-token": owner.csrf };
    const cases = [
      { ...valid, origin: "" }, { ...valid, origin: "null" }, { ...valid, origin: "http://localhost:3000" },
      { ...valid, origin: "http://127.0.0.1:3000.evil" }, { ...valid, origin: "http://127.0.0.1:3000/" },
      { ...valid, host: "evil.example", "x-forwarded-host": "127.0.0.1:3000" },
      { ...valid, "x-csrf-token": "" }, { ...valid, "x-csrf-token": randomBytes(32).toString("base64url") },
      { ...valid, cookie: owner.cookie.replace(/scope_csrf=[^;]+/, "scope_csrf=invalid") },
      { ...valid, cookie: owner.cookie.replace(/; scope_csrf=[^;]+/, "") },
    ];
    for (const headers of cases) expect(() => requireOwnerMutation(context(headers, "POST"))).toThrow();
    expect(requireOwnerMutation(context(valid, "POST")).ownerId).toBe(ownerRow.id);
  });

  it("requires anonymous bootstrap on login and redacts 2 credential failures", async () => {
    await expect(login(context({ origin: "http://127.0.0.1:3000" }, "POST"), { username: "owner", password })).rejects.toThrow();
    const session = anonymous();
    const ctx = context({ cookie: session.cookie, origin: "http://127.0.0.1:3000", "x-csrf-token": session.csrf }, "POST");
    let first = "";
    let second = "";
    try { await login(ctx, { username: "owner", password: "secret-wrong-password" }); } catch (error) { first = String(error); }
    try { await login(ctx, { username: "missing-owner", password: "secret-wrong-password" }); } catch (error) { second = String(error); }
    expect(first).toBe(second);
    expect(first).not.toMatch(/secret-wrong-password|missing-owner|password_salt|password_hash/);
  });

  it("throttles after 5 failed attempts, recovers after 15 minutes", async () => {
    const session = anonymous();
    const ctx = context({ cookie: session.cookie, origin: "http://127.0.0.1:3000", "x-csrf-token": session.csrf }, "POST");
    for (let index = 0; index < 5; index++) await expect(login(ctx, { username: "owner", password: "wrong" })).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    await expect(login(ctx, { username: "owner", password })).rejects.toMatchObject({ code: "RATE_LIMITED" });
    now += 15 * 60 * 1000;
    const fresh = anonymous();
    await expect(login(context({ cookie: fresh.cookie, origin: "http://127.0.0.1:3000", "x-csrf-token": fresh.csrf }, "POST"), { username: "owner", password })).resolves.toMatchObject({ authenticated: true });
  });

  it("bounds hashing concurrency at 2, rejects 3rd instead of queuing", async () => {
    const requests = Array.from({ length: 3 }, () => {
      const session = anonymous();
      return context({ cookie: session.cookie, origin: "http://127.0.0.1:3000", "x-csrf-token": session.csrf }, "POST");
    });
    const results = await Promise.allSettled(requests.map((ctx) => login(ctx, { username: "owner", password })));
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(2);
    expect(results.filter((result) => result.status === "rejected").map((result) => result.reason.code)).toEqual(["RATE_LIMITED"]);
  });

  it("checks input size before hashes and adds Secure for HTTPS", async () => {
    const session = anonymous();
    const ctx = context({ cookie: session.cookie, origin: "http://127.0.0.1:3000", "x-csrf-token": session.csrf }, "POST");
    await expect(login(ctx, { username: "owner", password: "x".repeat(257) })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(provisionOwner(db, "other", "short")).rejects.toMatchObject({ code: "VALIDATION" });
    const secure = context({ host: "scope.example" }, "GET", "https://scope.example/api/session");
    secure.config = getConfig({ NODE_ENV: "test", APP_ORIGIN: "https://scope.example" });
    bootstrapCsrf(secure);
    expect(secure.responseHeaders.getSetCookie().every((cookie) => cookie.includes("Secure"))).toBe(true);
  });
});

describe("narrow hashed buyer capabilities", () => {
  function capability() {
    const token = randomBytes(32).toString("base64url");
    db.prepare("INSERT INTO engagements VALUES (?, ?, NULL, ?)").run("engagement", ownerRow.id as string, now);
    db.prepare("INSERT INTO quotes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run("quote", "engagement", 1, "{}", 10000, 2500, "USD", ownerRow.id as string, now);
    db.prepare("UPDATE engagements SET active_quote_id = 'quote' WHERE id = 'engagement'").run();
    db.exec("INSERT INTO attempts (id, engagement_id, quote_id, merchant_id, deposit_cents, currency, state, guard_held, created_at) VALUES ('attempt', 'engagement', 'quote', 'merchant', 2500, 'USD', 'reserved', 1, 1000)");
    db.prepare("INSERT INTO capabilities VALUES (?, ?, ?, ?, ?, NULL)").run("capability", hash(token), "attempt", "quote", now + 24 * 60 * 60 * 1000);
    return token;
  }

  it("requires valid bound token and session CSRF for mutation, grants no owner authority", () => {
    const token = capability();
    const session = anonymous();
    const headers = { cookie: session.cookie, origin: "http://127.0.0.1:3000", "x-csrf-token": session.csrf, "x-checkout-token": token };
    expect(requireBuyerRead(context(headers))).toEqual({ capabilityId: "capability", attemptId: "attempt", quoteId: "quote" });
    expect(requireBuyerMutation(context(headers, "POST"))).toEqual(requireBuyerRead(context(headers)));
    expect(() => requireOwnerRead(context(headers))).toThrow();
    expect(() => requireBuyerMutation(context({ "x-checkout-token": token, origin: headers.origin }, "POST"))).toThrow();
    expect(() => requireBuyerRead(context({ "x-checkout-token": randomBytes(32).toString("base64url") }))).toThrow();
    db.exec("UPDATE capabilities SET revoked_at = 1000");
    expect(() => requireBuyerRead(context(headers))).toThrow();
  });

  it("rejects expiry, stale active revision and cross-bound quote", () => {
    const token = capability();
    now += 24 * 60 * 60 * 1000;
    expect(() => requireBuyerRead(context({ "x-checkout-token": token }))).toThrow();
    now = 1000;
    db.exec("UPDATE engagements SET active_quote_id = NULL");
    expect(() => requireBuyerRead(context({ "x-checkout-token": token }))).toThrow();
    db.exec("UPDATE engagements SET active_quote_id = 'quote'; INSERT INTO quotes VALUES ('quote-2', 'engagement', 2, '{}', 10000, 2500, 'USD', '" + ownerRow.id + "', 1000); UPDATE capabilities SET quote_id = 'quote-2'");
    expect(() => requireBuyerRead(context({ "x-checkout-token": token }))).toThrow();
  });

  it("preserves dispatched capability access after active draft revision changes", () => {
    const token = capability();
    db.exec("UPDATE attempts SET state = 'uncertain'; INSERT INTO operations (attempt_id, kind, request_id, first_dispatched_at, retry_until, status) VALUES ('attempt', 'create', 'key', 1000, 21601000, 'uncertain'); UPDATE engagements SET active_quote_id = NULL");
    expect(requireBuyerRead(context({ "x-checkout-token": token }))).toEqual({ capabilityId: "capability", attemptId: "attempt", quoteId: "quote" });
    db.exec("UPDATE capabilities SET revoked_at = 1000");
    expect(() => requireBuyerRead(context({ "x-checkout-token": token }))).toThrow();
  });
});
