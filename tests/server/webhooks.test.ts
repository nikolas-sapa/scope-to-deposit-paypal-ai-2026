import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getConfig } from "../../src/server/config";
import type { HttpContext, PayPalGateway, ProviderOrder } from "../../src/server/context";
import { openDatabase } from "../../src/server/db";
import { processReceipts, receiveWebhook } from "../../src/server/webhooks";

let db: DatabaseSync; let ctx: HttpContext; let failVerify: boolean; let failGet: boolean; let captureDispatches: number; let canonical: ProviderOrder;
let directory: string; let dbPath: string;
const event = (id = "EVENT1", resourceId = "CAPTURE1") => Buffer.from(JSON.stringify({ id, event_type: "PAYMENT.CAPTURE.COMPLETED", resource: { id: resourceId, supplementary_data: { related_ids: { order_id: "ORDER1" } } } }));
function seed(id = "1", orderId = "ORDER1") {
  db.prepare("INSERT INTO engagements VALUES (?, 'owner', ?, 1)").run(`eng${id}`, `quote${id}`);
  db.prepare("INSERT INTO quotes VALUES (?, ?, 1, '{}', 10000, 5000, 'USD', 'owner', 1)").run(`quote${id}`, `eng${id}`);
  db.prepare("INSERT INTO attempts (id, engagement_id, quote_id, merchant_id, deposit_cents, currency, order_id, state, guard_held, created_at) VALUES (?, ?, ?, 'merchant', 5000, 'USD', ?, 'uncertain', 1, 1)").run(`attempt${id}`, `eng${id}`, `quote${id}`, orderId);
}
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "scope-webhook-test-")); dbPath = join(directory, "webhook.sqlite");
  db = openDatabase(dbPath); db.exec("INSERT INTO owners VALUES ('owner', 'owner', 'salt', 'hash', '{}', 1)"); seed();
  failVerify = false; failGet = false; captureDispatches = 0;
  canonical = { id: "ORDER1", status: "COMPLETED", merchantId: "merchant", amountCents: 5000, currency: "USD", approvalUrl: null, captures: [{ id: "CAPTURE1", status: "COMPLETED", orderId: "ORDER1", merchantId: "merchant", amountCents: 5000, currency: "USD" }], provenance: "LOCAL_FIXTURE" };
  const provider: PayPalGateway = {
    async createOrder() { throw new Error("forbidden create"); },
    async captureOrder() { captureDispatches++; throw new Error("forbidden capture"); },
    async getOrder(id) { if (failGet) throw new Error("fixture outage"); return { ...structuredClone(canonical), id, captures: canonical.captures.map((capture) => ({ ...capture, orderId: id })) }; },
    async verifyWebhook(raw) {
      if (failVerify) throw new Error("fixture forged");
      const text = Buffer.from(raw).toString("utf8"); const value = JSON.parse(text);
      return { eventId: value.id, eventType: value.event_type, resourceId: value.resource.id, orderId: value.resource.supplementary_data.related_ids.order_id, rawBody: text, bodyHash: createHash("sha256").update(raw).digest("hex") };
    },
  };
  ctx = { db, config: getConfig({ NODE_ENV: "test", PAYPAL_CLIENT_ID: "fixture", PAYPAL_CLIENT_SECRET: "fixture", PAYPAL_MERCHANT_ID: "merchant", PAYPAL_WEBHOOK_ID: "registered" }), request: new Request("http://127.0.0.1:3000/api/webhooks/paypal"), now: () => 1000, responseHeaders: new Headers(), provider };
});
afterEach(() => { db.close(); rmSync(directory, { recursive: true, force: true }); });
const paidCount = () => db.prepare("SELECT COUNT(*) AS count FROM paid_deposits").get()!.count;

describe("LOCAL_FIXTURE authenticated durable webhook receipts", () => {
  it("T03:10 event replays produce1 receipt/paid row,0 capture dispatches", async () => {
    for (let i = 0; i < 10; i++) expect(await receiveWebhook(ctx, event(), new Headers())).toEqual({ status: 204 });
    expect(db.prepare("SELECT COUNT(*) AS count FROM webhook_receipts").get()).toEqual({ count: 1 });
    expect(paidCount()).toBe(1); expect(captureDispatches).toBe(0);
  });
  it("T13:10 verifier failures persist0 receipts and0 payments", async () => {
    failVerify = true;
    for (let i = 0; i < 10; i++) expect((await receiveWebhook(ctx, event(`FORGED${i}`), new Headers())).status).not.toBe(204);
    expect(paidCount()).toBe(0); expect(db.prepare("SELECT COUNT(*) AS count FROM webhook_receipts").get()).toEqual({ count: 0 });
  });
  it("same event ID with different authenticated body rejects400", async () => {
    expect((await receiveWebhook(ctx, event(), new Headers())).status).toBe(204);
    expect((await receiveWebhook(ctx, event("EVENT1", "OTHER"), new Headers())).status).toBe(400);
    expect(paidCount()).toBe(1);
  });
  it("T19:failure before persistence returns503; redelivery persists then pays exactly1", async () => {
    db.exec("CREATE TRIGGER fail_receipt BEFORE INSERT ON webhook_receipts BEGIN SELECT RAISE(ABORT, 'fixture crash before persist'); END");
    expect((await receiveWebhook(ctx, event(), new Headers())).status).toBe(503); expect(paidCount()).toBe(0);
    db.close(); db = openDatabase(dbPath); ctx.db = db;
    db.exec("DROP TRIGGER fail_receipt");
    expect((await receiveWebhook(ctx, event(), new Headers())).status).toBe(204); expect(paidCount()).toBe(1);
    expect(captureDispatches).toBe(0);
  });
  it("T19:failure after durable persist acknowledges204 and restart resumes exactly1", async () => {
    failGet = true;
    expect((await receiveWebhook(ctx, event(), new Headers())).status).toBe(204);
    expect(db.prepare("SELECT processed_at FROM webhook_receipts").get()).toEqual({ processed_at: null }); expect(paidCount()).toBe(0);
    db.close(); db = openDatabase(dbPath); ctx.db = db;
    failGet = false; await processReceipts(ctx, 100); await processReceipts(ctx, 100);
    expect(paidCount()).toBe(1); expect(captureDispatches).toBe(0);
  });
  it("canonical GET governs amount, webhook resource alone cannot authorize paid", async () => {
    canonical.amountCents = 1;
    expect((await receiveWebhook(ctx, event(), new Headers())).status).toBe(204);
    expect(paidCount()).toBe(0); expect(captureDispatches).toBe(0);
  });
  it("receipt before local order binding stays pending and resumes after binding", async () => {
    db.exec("DELETE FROM attempts");
    expect((await receiveWebhook(ctx, event(), new Headers())).status).toBe(204);
    expect(db.prepare("SELECT processed_at FROM webhook_receipts").get()).toEqual({ processed_at: null });
    db.prepare("INSERT INTO attempts (id, engagement_id, quote_id, merchant_id, deposit_cents, currency, order_id, state, guard_held, created_at) VALUES ('attempt1', 'eng1', 'quote1', 'merchant', 5000, 'USD', 'ORDER1', 'uncertain', 1, 1)").run();
    await processReceipts(ctx, 100);
    expect(paidCount()).toBe(1); expect(captureDispatches).toBe(0);
  });
  it("completed event with lagging canonical pending capture resumes later", async () => {
    canonical.captures[0].status = "PENDING";
    expect((await receiveWebhook(ctx, event(), new Headers())).status).toBe(204);
    expect(db.prepare("SELECT processed_at FROM webhook_receipts").get()).toEqual({ processed_at: null });
    canonical.captures[0].status = "COMPLETED";
    await processReceipts(ctx, 100); expect(paidCount()).toBe(1); expect(captureDispatches).toBe(0);
  });
  it("bounded batch schedules unknown receipts fairly before newer known receipt", async () => {
    for (let i = 0; i < 20; i++) {
      const raw = Buffer.from(JSON.stringify({ id: `UNKNOWN${i}`, event_type: "PAYMENT.CAPTURE.COMPLETED", resource: { id: "UNKNOWN", supplementary_data: { related_ids: { order_id: "UNKNOWN" } } } }));
      expect((await receiveWebhook(ctx, raw, new Headers())).status).toBe(204);
    }
    failGet = true; await receiveWebhook(ctx, event(), new Headers()); failGet = false;
    await processReceipts(ctx, 1);
    expect(paidCount()).toBe(1);
    expect(db.prepare("SELECT COUNT(*) AS count FROM webhook_receipts WHERE processed_at IS NULL").get()).toEqual({ count: 20 });
  });
  it("reused capture across engagements cannot produce second paid row", async () => {
    await receiveWebhook(ctx, event(), new Headers()); seed("2", "ORDER2");
    const raw = Buffer.from(JSON.stringify({ id: "EVENT2", event_type: "PAYMENT.CAPTURE.COMPLETED", resource: { id: "CAPTURE1", supplementary_data: { related_ids: { order_id: "ORDER2" } } } }));
    expect((await receiveWebhook(ctx, raw, new Headers())).status).toBe(204);
    expect(paidCount()).toBe(1); expect(db.prepare("SELECT state FROM attempts WHERE id = 'attempt2'").get()).toEqual({ state: "uncertain" });
  });
  it("bounds raw bodies and process batch inputs", async () => {
    expect((await receiveWebhook(ctx, Buffer.alloc(262145), new Headers())).status).toBe(400);
    await expect(processReceipts(ctx, -1)).rejects.toThrow();
  });
});
