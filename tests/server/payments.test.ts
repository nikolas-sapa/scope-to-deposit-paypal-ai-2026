import { createHash, randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { requireBuyerMutation } from "../../src/server/auth";
import { getConfig } from "../../src/server/config";
import type { BuyerPrincipal, HttpContext, PayPalGateway, ProviderOperation, ProviderOrder } from "../../src/server/context";
import { openDatabase } from "../../src/server/db";
import { approve, createEngagement, saveDraft } from "../../src/server/engagements";
import { captureOrder, createOrder, getBuyer, issueCheckout, observeCancel, reconcile, recoverUnresolved, revokeCheckout } from "../../src/server/payments";
import type { DraftInput } from "../../src/shared/contracts";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const owner = { ownerId: "owner" };
let db: DatabaseSync; let ctx: HttpContext; let clock: number; let provider: FixtureProvider; let directory: string; let dbPath: string;
class FixtureProvider implements PayPalGateway {
  orders = new Map<string, ProviderOrder>(); keys = new Map<string, string>(); captures = new Set<string>();
  createCalls: ProviderOperation[] = []; captureCalls: ProviderOperation[] = [];
  getCalls: string[] = []; failGets = new Set<string>();
  loseCreate = false; loseCapture = false; beforeCapture?: () => Promise<void>;
  async createOrder(operation: ProviderOperation): Promise<ProviderOrder> {
    this.createCalls.push(structuredClone(operation));
    let id = this.keys.get(operation.requestId);
    if (!id) {
      id = `ORDER${this.orders.size + 1}`; this.keys.set(operation.requestId, id);
      const unit = (operation.payload.purchase_units as { amount: { value: string; currency_code: string }; payee: { merchant_id: string } }[])[0];
      this.orders.set(id, { id, status: "APPROVED", amountCents: Math.round(Number(unit.amount.value) * 100), currency: unit.amount.currency_code, merchantId: unit.payee.merchant_id, approvalUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${id}`, captures: [], provenance: "LOCAL_FIXTURE" });
    }
    if (this.loseCreate) { this.loseCreate = false; throw new Error("lost create response"); }
    return structuredClone(this.orders.get(id)!);
  }
  async getOrder(id: string): Promise<ProviderOrder> {
    this.getCalls.push(id); if (this.failGets.has(id)) throw new Error("fixture GET unavailable");
    return structuredClone(this.orders.get(id)!);
  }
  async captureOrder(operation: ProviderOperation): Promise<ProviderOrder> {
    this.captureCalls.push(structuredClone(operation));
    const value = this.orders.get(operation.orderId!)!;
    if (value.captures.length === 0) {
      const captureId = `CAPTURE${this.captures.size + 1}`; this.captures.add(captureId);
      value.status = "COMPLETED";
      value.captures.push({ id: captureId, status: "COMPLETED", orderId: value.id, merchantId: value.merchantId, amountCents: value.amountCents, currency: value.currency });
    }
    await this.beforeCapture?.();
    if (this.loseCapture) { this.loseCapture = false; throw new Error("lost capture response"); }
    return structuredClone(value);
  }
  async verifyWebhook(): Promise<never> { throw new Error("unused fixture verifier"); }
}
function request(token?: string): Request {
  const session = randomBytes(32).toString("base64url"), csrf = randomBytes(32).toString("base64url");
  db.prepare("INSERT INTO sessions VALUES (?, ?, ?, ?)").run(hash(session), token ? null : owner.ownerId, hash(csrf), clock + 1000000000);
  return new Request("http://127.0.0.1:3000/api/buyer", { method: "POST", headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000", cookie: `scope_session=${session}; scope_csrf=${csrf}`, "x-csrf-token": csrf, ...(token ? { "x-checkout-token": token } : {}) } });
}
function draft(depositCents = 5000): DraftInput { return { brief: "Site", goal: "Site", deliverables: ["Pages"], timing: null, constraints: [], assumptions: [], questions: [], items: [{ description: "Site", quantity: 2, unitCents: 10000 }], depositCents }; }
function approved(deposit = 5000) {
  const engagement = createEngagement(ctx, owner);
  const saved = saveDraft(ctx, owner, engagement.engagementId, { expectedVersion: 1, draft: draft(deposit) });
  return { id: engagement.engagementId, quote: approve(ctx, owner, engagement.engagementId, { expectedVersion: saved.draftVersion }), version: saved.draftVersion };
}
function checkout(entry = approved()) {
  const link = issueCheckout(ctx, owner, entry.id, { quoteId: entry.quote.quoteId });
  const token = new URL(link.checkoutUrl).hash.slice(1);
  const buyerCtx = { ...ctx, request: request(token) };
  const buyer = requireBuyerMutation(buyerCtx);
  return { ...entry, buyerCtx, buyer, token, capabilityId: link.capabilityId };
}
const count = (table: string) => db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get()!.count;
beforeEach(() => {
  clock = 1000; directory = mkdtempSync(join(tmpdir(), "scope-payment-test-")); dbPath = join(directory, "payment.sqlite"); db = openDatabase(dbPath);
  db.exec("INSERT INTO owners VALUES ('owner', 'owner', 'salt', 'hash', '{}', 1)");
  provider = new FixtureProvider();
  ctx = { db, request: request(), now: () => clock, responseHeaders: new Headers(), provider,
    config: getConfig({ NODE_ENV: "test", PAYPAL_CLIENT_ID: "fixture", PAYPAL_CLIENT_SECRET: "fixture", PAYPAL_MERCHANT_ID: "merchant", PAYPAL_WEBHOOK_ID: "registered" }) };
});
afterEach(() => { db.close(); rmSync(directory, { recursive: true, force: true }); });

describe("LOCAL_FIXTURE immutable payment authority", () => {
  it("T02:10 exact approved USD deposits and10 client overrides rejected", async () => {
    for (let i = 0; i < 10; i++) {
      const entry = approved(5000 + i);
      expect(() => issueCheckout(ctx, owner, entry.id, { quoteId: entry.quote.quoteId, depositCents: 1 } as never)).toThrow();
      const buyer = checkout(entry); await createOrder(buyer.buyerCtx, buyer.buyer);
      expect(provider.orders.get(`ORDER${i + 1}`)).toMatchObject({ amountCents: 5000 + i, currency: "USD", merchantId: "merchant" });
      expect((await captureOrder(buyer.buyerCtx, buyer.buyer)).paid).toBe(true);
    }
    expect(provider.orders.size).toBe(10); expect(provider.captures.size).toBe(10); expect(count("paid_deposits")).toBe(10);
  });
  it("T09:10 unapproved requests and forged principals cause0 dispatches", async () => {
    for (let i = 0; i < 10; i++) {
      const engagement = createEngagement(ctx, owner);
      expect(() => issueCheckout(ctx, owner, engagement.engagementId, { quoteId: "unapproved" })).toThrow();
      await expect(createOrder(ctx, { capabilityId: "forged", attemptId: "forged", quoteId: "forged" })).rejects.toThrow();
    }
    expect(count("attempts")).toBe(0); expect(provider.createCalls).toHaveLength(0); expect(provider.captureCalls).toHaveLength(0);
  });
  it("owner revokes checkout using returned resource ID", async () => {
    const entry = checkout(); expect(entry.capabilityId).toBe(entry.buyer.capabilityId);
    revokeCheckout(ctx, owner, entry.capabilityId);
    await expect(createOrder(entry.buyerCtx, entry.buyer)).rejects.toThrow(); expect(provider.orders.size).toBe(0);
  });
  it("T03/T10:10 concurrent captures plus10 replays yield1 provider capture and1 immutable paid row", async () => {
    const entry = checkout(); await createOrder(entry.buyerCtx, entry.buyer);
    await Promise.all(Array.from({ length: 10 }, () => captureOrder(entry.buyerCtx, entry.buyer)));
    for (let i = 0; i < 10; i++) await captureOrder(entry.buyerCtx, entry.buyer);
    expect(provider.orders.size).toBe(1); expect(provider.captures.size).toBe(1); expect(provider.captureCalls).toHaveLength(1);
    expect(count("paid_deposits")).toBe(1); expect(getBuyer(entry.buyerCtx, entry.buyer).payment.paid).toBe(true);
    expect(observeCancel(entry.buyerCtx, entry.buyer)).toMatchObject({ paid: true, cancelObserved: true });
    expect(() => db.exec("DELETE FROM paid_deposits")).toThrow();
  });
  it("T17:10 revision overlaps keep1 lifetime order and1 guarded attempt each", async () => {
    for (let i = 0; i < 10; i++) {
      const entry = checkout(); await createOrder(entry.buyerCtx, entry.buyer);
      const edited = saveDraft(ctx, owner, entry.id, { expectedVersion: entry.version, draft: draft(6000) });
      const next = approve(ctx, owner, entry.id, { expectedVersion: edited.draftVersion });
      expect(() => issueCheckout(ctx, owner, entry.id, { quoteId: next.quoteId })).toThrow();
      expect(getBuyer(entry.buyerCtx, entry.buyer).quote.depositCents).toBe(5000);
      await captureOrder(entry.buyerCtx, entry.buyer);
    }
    expect(count("attempts")).toBe(10); expect(provider.orders.size).toBe(10); expect(provider.captures.size).toBe(10);
  });
  it("unused attempt supersession revokes capability and permits only new approved revision", async () => {
    const entry = checkout();
    const edited = saveDraft(ctx, owner, entry.id, { expectedVersion: entry.version, draft: draft(6000) });
    const next = approve(ctx, owner, entry.id, { expectedVersion: edited.draftVersion });
    await expect(createOrder(entry.buyerCtx, entry.buyer)).rejects.toThrow();
    const replacement = checkout({ id: entry.id, quote: next, version: edited.draftVersion });
    await createOrder(replacement.buyerCtx, replacement.buyer);
    expect(provider.orders.size).toBe(1);
  });
});

describe("LOCAL_FIXTURE uncertain recovery and races", () => {
  it("real adapter OAuth crossing persisted lost-create deadline causes0 expired POSTs and0 new keys/orders", async () => {
    const entry = checkout(); let createPosts = 0; let tokenRequests = 0;
    const dispatchTimes: number[] = [];
    const fetcher: typeof fetch = async (input) => {
      if (String(input).endsWith("/token")) {
        tokenRequests++; if (tokenRequests === 2) clock += 32000;
        return Response.json({ access_token: "fixture-token", expires_in: 3600 });
      }
      if (String(input).endsWith("/v2/checkout/orders")) {
        createPosts++; dispatchTimes.push(clock);
        if (createPosts === 1) throw new Error("fixture lost response after provider created original order");
      }
      return Response.json({ id: `ORDER${createPosts}`, status: "APPROVED", purchase_units: [{ amount: { value: "50.00", currency_code: "USD" }, payee: { merchant_id: "merchant" } }], links: [] });
    };
    entry.buyerCtx.provider = undefined; entry.buyerCtx.fetchImpl = fetcher;
    await createOrder(entry.buyerCtx, entry.buyer);
    const original = db.prepare("SELECT request_id, payload_json, payload_hash, retry_until FROM operations WHERE kind = 'create'").get()!;
    clock = Number(original.retry_until) - 31000;
    await createOrder(entry.buyerCtx, entry.buyer);
    expect(tokenRequests).toBe(2); expect(createPosts).toBe(1); expect(dispatchTimes.every((time) => time < Number(original.retry_until))).toBe(true);
    expect(db.prepare("SELECT request_id, payload_json, payload_hash, retry_until FROM operations WHERE kind = 'create'").get()).toEqual(original);
    expect(db.prepare("SELECT state, guard_held, order_id FROM attempts").get()).toEqual({ state: "uncertain", guard_held: 1, order_id: null });
    expect(count("attempts")).toBe(1); expect(count("paid_deposits")).toBe(0);
  });
  it.each(["unchanged", "failed"])("21-attempt recovery reaches newest completion within2 bounded20 batches despite oldest20 %s", async (oldest) => {
    for (let i = 0; i < 21; i++) {
      clock++; const entry = checkout(); await createOrder(entry.buyerCtx, entry.buyer);
    }
    const newest = provider.orders.get("ORDER21")!;
    newest.status = "COMPLETED";
    newest.captures = [{ id: "RECOVERY_CAPTURE", status: "COMPLETED", orderId: newest.id, merchantId: "merchant", amountCents: 5000, currency: "USD" }];
    provider.captures.add("RECOVERY_CAPTURE");
    if (oldest === "failed") for (let i = 1; i <= 20; i++) provider.failGets.add(`ORDER${i}`);
    provider.getCalls = [];
    await recoverUnresolved(ctx);
    expect(provider.getCalls).toHaveLength(20); expect(count("paid_deposits")).toBe(0);
    await recoverUnresolved(ctx);
    expect(count("paid_deposits")).toBe(1);
    expect(provider.getCalls).toHaveLength(40); expect(new Set(provider.getCalls).size).toBe(21);
    expect(provider.captures.size).toBe(1); expect(provider.captureCalls).toHaveLength(0);
    expect(provider.orders.size).toBe(21);
  });
  it("T11:lost create retains identical key/payload,10 concurrent retries produce1 lifetime order", async () => {
    const entry = checkout(); provider.loseCreate = true;
    await createOrder(entry.buyerCtx, entry.buyer);
    db.close(); db = openDatabase(dbPath); ctx.db = db; entry.buyerCtx.db = db;
    clock += 31000;
    await Promise.all(Array.from({ length: 10 }, () => createOrder(entry.buyerCtx, entry.buyer)));
    expect(provider.orders.size).toBe(1); expect(provider.createCalls).toHaveLength(2);
    expect(provider.createCalls[0]).toEqual(provider.createCalls[1]);
    expect(count("attempts")).toBe(1); expect(provider.captures.size).toBe(0);
  });
  it("T11:lost capture and restart recovery read original capture without redispatch", async () => {
    const entry = checkout(); await createOrder(entry.buyerCtx, entry.buyer); provider.loseCapture = true;
    await captureOrder(entry.buyerCtx, entry.buyer);
    db.close(); db = openDatabase(dbPath); ctx.db = db; entry.buyerCtx.db = db;
    clock += 31000; await recoverUnresolved(ctx);
    expect((await reconcile(ctx, owner, entry.id)).paid).toBe(true);
    expect(provider.orders.size).toBe(1); expect(provider.captures.size).toBe(1); expect(provider.captureCalls).toHaveLength(1); expect(count("paid_deposits")).toBe(1);
  });
  it("T12:10 uncertain replacement requests beyond6h create0 new orders/keys", async () => {
    const entry = checkout(); provider.loseCreate = true; await createOrder(entry.buyerCtx, entry.buyer);
    const operations = db.prepare("SELECT request_id, payload_json FROM operations").all();
    clock += 21600001;
    for (let i = 0; i < 10; i++) {
      expect(() => issueCheckout(ctx, owner, entry.id, { quoteId: entry.quote.quoteId })).toThrow();
      await createOrder(entry.buyerCtx, entry.buyer); await reconcile(ctx, owner, entry.id);
    }
    expect(provider.orders.size).toBe(1); expect(provider.createCalls).toHaveLength(1); expect(provider.captures.size).toBe(0);
    expect(db.prepare("SELECT request_id, payload_json FROM operations").all()).toEqual(operations);
    expect(db.prepare("SELECT guard_held FROM attempts").get()).toEqual({ guard_held: 1 });
  });
  it("T18:5 revoked/expired-before cases dispatch0 captures,5 after-dispatch apply paid", async () => {
    for (let i = 0; i < 5; i++) {
      const entry = checkout(); await createOrder(entry.buyerCtx, entry.buyer);
      if (i % 2) revokeCheckout(ctx, owner, entry.buyer.capabilityId);
      else db.prepare("UPDATE capabilities SET expires_at = ? WHERE id = ?").run(clock, entry.buyer.capabilityId);
      await expect(captureOrder(entry.buyerCtx, entry.buyer)).rejects.toThrow();
    }
    expect(provider.captures.size).toBe(0);
    for (let i = 0; i < 5; i++) {
      const entry = checkout(); await createOrder(entry.buyerCtx, entry.buyer);
      provider.beforeCapture = async () => {
        if (i % 2) revokeCheckout(ctx, owner, entry.buyer.capabilityId);
        else db.prepare("UPDATE capabilities SET expires_at = ? WHERE id = ?").run(clock, entry.buyer.capabilityId);
      };
      expect((await captureOrder(entry.buyerCtx, entry.buyer)).paid).toBe(true);
    }
    expect(provider.captures.size).toBe(5); expect(count("paid_deposits")).toBe(5);
  });
  it("T18:10 cancellation/capture races preserve10 paid rows and0 replacements", async () => {
    for (let i = 0; i < 10; i++) {
      const entry = checkout(); await createOrder(entry.buyerCtx, entry.buyer);
      provider.beforeCapture = async () => { expect(observeCancel(entry.buyerCtx, entry.buyer).cancelObserved).toBe(true); };
      expect((await captureOrder(entry.buyerCtx, entry.buyer)).paid).toBe(true);
      expect(() => issueCheckout(ctx, owner, entry.id, { quoteId: entry.quote.quoteId })).toThrow();
    }
    expect(provider.orders.size).toBe(10); expect(provider.captures.size).toBe(10); expect(count("paid_deposits")).toBe(10);
  });
  it("T20:10 mismatched canonical evidence cases yield0 paid rows", async () => {
    for (let i = 0; i < 10; i++) {
      const entry = checkout(); await createOrder(entry.buyerCtx, entry.buyer);
      const value = provider.orders.get(`ORDER${i + 1}`)!;
      value.status = "COMPLETED";
      value.captures = [{ id: `BAD${i}`, status: "COMPLETED", orderId: value.id, merchantId: "merchant", amountCents: 5000, currency: "USD" }];
      if (i === 0) value.id = "FOREIGN";
      if (i === 1) value.merchantId = "foreign";
      if (i === 2) value.amountCents = 1;
      if (i === 3) value.currency = "EUR";
      if (i === 4) value.captures[0].orderId = "FOREIGN";
      if (i === 5) value.captures[0].merchantId = "foreign";
      if (i === 6) value.captures[0].amountCents = 1;
      if (i === 7) value.captures[0].currency = "EUR";
      if (i === 8) value.captures[0].status = "PENDING";
      if (i === 9) value.captures.push({ ...value.captures[0], id: "EXTRA" });
      await reconcile(ctx, owner, entry.id);
      expect(getBuyer(entry.buyerCtx, entry.buyer).payment.paid).toBe(false);
    }
    expect(count("paid_deposits")).toBe(0); expect(provider.captureCalls).toHaveLength(0);
  });
  it("preapproval canceled observations cause0 captures/paid, terminal VOIDED releases guard", async () => {
    for (let i = 0; i < 10; i++) {
      const entry = checkout(); await createOrder(entry.buyerCtx, entry.buyer);
      expect(observeCancel(entry.buyerCtx, entry.buyer)).toMatchObject({ paid: false, cancelObserved: true });
      const value = provider.orders.get(`ORDER${i + 1}`)!; value.status = "VOIDED";
      expect((await reconcile(ctx, owner, entry.id)).state).toBe("terminal_unpaid");
    }
    expect(provider.captures.size).toBe(0); expect(count("paid_deposits")).toBe(0);
  });
});
