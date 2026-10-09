import { createHash, randomBytes } from "node:crypto";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { openDatabase } from "../../src/server/db";
import { provisionOwner } from "../../src/server/auth";
import { dispatchApi } from "../../src/server/http";
import type { Config, HttpContext, PayPalGateway } from "../../src/server/context";
import type { DraftInput, EngagementDto } from "../../src/shared/contracts";
import type { DatabaseSync } from "node:sqlite";

const origin = "http://127.0.0.1:3000";
const config: Config = { appOrigin: origin, databasePath: ":memory:", paypalClientId: "", paypalClientSecret: "", paypalMerchantId: "", paypalWebhookId: "", geminiApiKey: "", geminiModel: "gemini-3.8-flash", aiUsageEnabled: false };
const validDraft: DraftInput = { brief: "Create a landing page, assets supplied, delivery October 30.", goal: "Create a landing page", deliverables: ["Landing page"], timing: "October 30", constraints: ["Assets supplied"], assumptions: [], questions: [], items: [{ description: "Landing page", quantity: 1, unitCents: 10000 }], depositCents: 5000 };
let owner: Record<string, string | number | null>;
let db: DatabaseSync;
let cookie: string;
let csrf: string;
let calls: number;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

function request(path: string, method = "GET", input?: unknown, extra: Record<string, string> = {}, authenticated = true): Request {
  const headers = new Headers({ host: "127.0.0.1:3000", ...extra });
  if (authenticated) { headers.set("cookie", cookie); headers.set("X-CSRF-Token", csrf); }
  if (method !== "GET") { headers.set("Origin", origin); headers.set("Content-Type", "application/json"); }
  return new Request(origin + path, { method, headers, body: input === undefined ? undefined : JSON.stringify(input) });
}
async function api(req: Request): Promise<Response> {
  const provider: PayPalGateway = {
    async createOrder() { calls++; throw new Error("Unexpected dispatch"); }, async captureOrder() { calls++; throw new Error("Unexpected dispatch"); }, async getOrder() { throw new Error("Unexpected read"); }, async verifyWebhook() { throw new Error("Unexpected webhook"); },
  };
  const ctx: HttpContext = { request: req, db, config, now: Date.now, responseHeaders: new Headers(), provider };
  return dispatchApi(ctx);
}
async function engagement(): Promise<EngagementDto> { return await (await api(request("/api/engagements", "POST", {}))).json() as EngagementDto; }

beforeAll(async () => {
  const seed = openDatabase(":memory:");
  await provisionOwner(seed, "http-owner", "A long synthetic test password 2026");
  owner = seed.prepare("SELECT * FROM owners").get() as typeof owner;
  seed.close();
});
beforeEach(() => {
  db = openDatabase(":memory:");
  db.prepare("INSERT INTO owners(id,username,password_salt,password_hash,scrypt_params,created_at) VALUES(?,?,?,?,?,?)").run(owner.id, owner.username, owner.password_salt, owner.password_hash, owner.scrypt_params, owner.created_at);
  const token = randomBytes(32).toString("base64url");
  csrf = randomBytes(32).toString("base64url");
  cookie = `scope_session=${token}; scope_csrf=${csrf}`;
  db.prepare("INSERT INTO sessions(token_hash,owner_id,csrf_hash,expires_at) VALUES(?,?,?,?)").run(hash(token), owner.id, hash(csrf), Date.now() + 3600000);
  calls = 0;
});
afterEach(() => { db.close(); });

describe("HTTP boundary with real auth and SQLite", () => {
  it("reports configuration booleans only with no-store headers", async () => {
    const response = await api(request("/api/health", "GET", undefined, {}, false));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ sandboxOnly: true, paypalConfigured: false, webhookConfigured: false, aiConfigured: false, aiUsageEnabled: false });
  });
  it("rejects 10 unauthenticated mutations before any provider dispatch", async () => {
    for (let index = 0; index < 10; index++) expect((await api(request("/api/engagements", "POST", {}, {}, false))).status).toBe(401);
    expect(db.prepare("SELECT COUNT(*) AS count FROM engagements").get()?.count).toBe(0);
    expect(calls).toBe(0);
  });
  it("rejects forged Origin and CSRF", async () => {
    const badOrigin = request("/api/engagements", "POST", {}); badOrigin.headers.set("Origin", "https://evil.invalid");
    expect((await api(badOrigin)).status).toBe(403);
    const badCsrf = request("/api/engagements", "POST", {}); badCsrf.headers.set("X-CSRF-Token", "forged");
    expect((await api(badCsrf)).status).toBe(403);
  });
  it("rejects 10 browser monetary overrides without changing draft", async () => {
    const value = await engagement();
    for (let index = 0; index < 10; index++) {
      const response = await api(request(`/api/engagements/${value.engagementId}/draft`, "PUT", { expectedVersion: value.draftVersion, draft: validDraft, amountCents: 1 }));
      expect(response.status).toBe(400);
    }
    expect((await (await api(request(`/api/engagements/${value.engagementId}`))).json()).draftVersion).toBe(value.draftVersion);
    expect(calls).toBe(0);
  });
  it("persists human draft and immutable approval through actual service routes", async () => {
    const value = await engagement();
    const saved = await api(request(`/api/engagements/${value.engagementId}/draft`, "PUT", { expectedVersion: value.draftVersion, draft: validDraft }));
    expect(saved.status).toBe(200);
    const updated = await saved.json();
    const approved = await api(request(`/api/engagements/${value.engagementId}/approve`, "POST", { expectedVersion: updated.draftVersion }));
    expect(approved.status).toBe(200);
    expect(await approved.json()).toMatchObject({ totalCents: 10000, depositCents: 5000, currency: "USD" });
    expect(db.prepare("SELECT COUNT(*) AS count FROM quotes").get()?.count).toBe(1);
  });
  it("keeps missing AI configuration unavailable without generation", async () => {
    const response = await api(request("/api/extract", "POST", { brief: "Create a site" }));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: "CONFIG_REQUIRED" } });
    expect(calls).toBe(0);
  });
  it("bounds bodies and rejects incorrect media type", async () => {
    const oversized = request("/api/extract", "POST", { brief: "x".repeat(1024 * 1024) });
    expect((await api(oversized)).status).toBe(413);
    const nonJson = request("/api/engagements", "POST", {}); nonJson.headers.set("Content-Type", "text/plain");
    expect((await api(nonJson)).status).toBe(415);
  });
  it("rejects route manipulation and buyer order fields", async () => {
    expect((await api(request("/api/engagements/not-an-id"))).status).toBe(404);
    expect((await api(request("/api/buyer/capture", "POST", { orderId: "foreign", amount: 1 }))).status).toBe(401);
    expect(calls).toBe(0);
  });
});
