import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getConfig } from "../../src/server/config";
import type { HttpContext } from "../../src/server/context";
import { openDatabase } from "../../src/server/db";
import { checkPayPalAccess, createPayPalGateway } from "../../src/server/paypal";

const databases: ReturnType<typeof openDatabase>[] = [];
function context(fetchImpl: typeof fetch, configured = true): HttpContext {
  const db = openDatabase(":memory:"); databases.push(db);
  return { db, request: new Request("http://127.0.0.1:3000"), responseHeaders: new Headers(), now: () => 1000, fetchImpl,
    config: getConfig(configured ? { NODE_ENV: "test", PAYPAL_CLIENT_ID: "fixture-client", PAYPAL_CLIENT_SECRET: "fixture-secret", PAYPAL_MERCHANT_ID: "merchant", PAYPAL_WEBHOOK_ID: "registered" } : { NODE_ENV: "test" }) };
}
const order = () => ({ id: "ORDER1", status: "COMPLETED", purchase_units: [{ amount: { currency_code: "USD", value: "50.00" }, payee: { merchant_id: "merchant" }, payments: { captures: [{ id: "CAPTURE1", status: "COMPLETED", amount: { currency_code: "USD", value: "50.00" }, supplementary_data: { related_ids: { order_id: "ORDER1" } } }] } }], links: [{ rel: "approve", href: "https://www.sandbox.paypal.com/checkoutnow?token=ORDER1" }] });
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
afterEach(() => { for (const db of databases.splice(0)) db.close(); vi.useRealTimers(); });

describe("LOCAL_FIXTURE sandbox transport", () => {
  it("fails absent config closed with zero fetches", async () => {
    const fetcher = vi.fn<typeof fetch>(); const ctx = context(fetcher, false);
    await expect(checkPayPalAccess(ctx)).rejects.toMatchObject({ code: "CONFIG_REQUIRED" });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("uses fixed origin, no redirects, stable request ID, cached OAuth and exact gross cents", async () => {
    const requests: { url: string; init?: RequestInit }[] = [];
    const fetcher: typeof fetch = async (input, init) => { requests.push({ url: String(input), init }); return String(input).endsWith("/token") ? json({ access_token: "fixture-token", expires_in: 3600 }) : json(order()); };
    const gateway = createPayPalGateway(context(fetcher));
    const values = await Promise.all(Array.from({ length: 10 }, () => gateway.getOrder("ORDER1")));
    await gateway.captureOrder({ requestId: "stable-key", orderId: "ORDER1", payload: {}, retryUntil: 21601000 });
    expect(requests.filter((entry) => entry.url.endsWith("/token"))).toHaveLength(1);
    expect(requests.every((entry) => entry.url.startsWith("https://api-m.sandbox.paypal.com/") && entry.init?.redirect === "error")).toBe(true);
    expect(new Headers(requests.find((entry) => entry.url.endsWith("/capture"))?.init?.headers).get("paypal-request-id")).toBe("stable-key");
    expect(values[0]).toMatchObject({ id: "ORDER1", amountCents: 5000, merchantId: "merchant", currency: "USD", captures: [{ id: "CAPTURE1", orderId: "ORDER1", amountCents: 5000 }] });
  });
  it("explicit fixture transport labels every normalized order LOCAL_FIXTURE", async () => {
    const fetcher: typeof fetch = async (input) => String(input).endsWith("/token") ? json({ access_token: "fixture-token", expires_in: 3600 }) : json(order());
    const gateway = createPayPalGateway(context(fetcher));
    expect((await gateway.getOrder("ORDER1")).provenance).toBe("LOCAL_FIXTURE");
    expect((await gateway.createOrder({ requestId: "fixture-create", payload: {}, retryUntil: 21601000 })).provenance).toBe("LOCAL_FIXTURE");
    expect((await gateway.captureOrder({ requestId: "fixture-capture", orderId: "ORDER1", payload: {}, retryUntil: 21601000 })).provenance).toBe("LOCAL_FIXTURE");
  });
  it("rejects missing bindings, malformed amounts and unsafe approval links", async () => {
    const invalid = Array.from({ length: 10 }, (_, i) => {
      const value = order();
      if (i < 6) value.purchase_units[0].amount.value = ["50.001", "-1.00", "1e2", "NaN", "99999999999999999999.00", "50"][i];
      else if (i === 6) value.purchase_units[0].payee.merchant_id = "";
      else if (i === 7) value.purchase_units.push(value.purchase_units[0]);
      else value.links[0].href = i === 8 ? "https://www.paypal.com/checkout" : "https://www.sandbox.paypal.com@evil.test/";
      return value;
    });
    for (const value of invalid) {
      const fetcher: typeof fetch = async (input) => String(input).endsWith("/token") ? json({ access_token: "token", expires_in: 3600 }) : json(value);
      await expect(createPayPalGateway(context(fetcher)).getOrder("ORDER1")).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE" });
    }
  });
  it("10 concurrent expired-token callers await1 held refresh with0 stale-token dispatches", async () => {
    let clock = 1000; let tokenCalls = 0; let release!: (value: Response) => void;
    const authorizations: string[] = [];
    const fetcher: typeof fetch = async (input, init) => {
      if (String(input).endsWith("/token")) {
        tokenCalls++;
        return tokenCalls === 1 ? json({ access_token: "old-token", expires_in: 3600 }) : new Promise<Response>((resolve) => { release = resolve; });
      }
      authorizations.push(new Headers(init?.headers).get("authorization")!); return json(order());
    };
    const ctx = context(fetcher); ctx.now = () => clock;
    await checkPayPalAccess(ctx); clock = 4000000;
    const gateway = createPayPalGateway(ctx);
    const pending = Promise.all(Array.from({ length: 10 }, () => gateway.getOrder("ORDER1")));
    await Promise.resolve(); await Promise.resolve();
    expect(tokenCalls).toBe(2); expect(authorizations).toHaveLength(0);
    release(json({ access_token: "new-token", expires_in: 3600 })); await pending;
    expect(authorizations).toHaveLength(10); expect(authorizations.every((value) => value === "Bearer new-token")).toBe(true);
  });
  it("capture OAuth crossing retryUntil dispatches0 capture POSTs", async () => {
    let clock = 1000; let capturePosts = 0;
    const fetcher: typeof fetch = async (input) => {
      if (String(input).endsWith("/token")) { clock = 11000; return json({ access_token: "fixture-token", expires_in: 3600 }); }
      if (String(input).endsWith("/capture")) capturePosts++;
      return json(order());
    };
    const ctx = context(fetcher); ctx.now = () => clock;
    await expect(createPayPalGateway(ctx).captureOrder({ requestId: "stable-capture", payload: {}, orderId: "ORDER1", retryUntil: 10000 })).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE" });
    expect(capturePosts).toBe(0);
  });
  it("redacts provider failures and bounds response bodies", async () => {
    for (const response of [json({ secret: "fixture-secret" }, 500), new Response("x".repeat(262145)), json({ access_token: "fixture-token", expires_in: 0 })]) {
      const fetcher: typeof fetch = async () => response;
      try { await checkPayPalAccess(context(fetcher)); throw new Error("expected failure"); }
      catch (error) { expect(error).toMatchObject({ code: "PROVIDER_UNAVAILABLE" }); expect(String(error)).not.toMatch(/fixture-secret|fixture-token/); }
    }
  });
  it("times out stalled body consumption at15s", async () => {
    vi.useFakeTimers();
    const fetcher: typeof fetch = async () => new Response(new ReadableStream({ start() {} }));
    const result = checkPayPalAccess(context(fetcher)); const check = expect(result).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE" });
    await vi.advanceTimersByTimeAsync(15000); await check;
  });
  it("verifies registered webhook by postback SUCCESS and retains exact raw hash", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const fetcher: typeof fetch = async (input, init) => { calls.push({ url: String(input), init }); return String(input).endsWith("/token") ? json({ access_token: "token", expires_in: 3600 }) : json({ verification_status: "SUCCESS" }); };
    const raw = Buffer.from(JSON.stringify({ id: "EVENT1", event_type: "PAYMENT.CAPTURE.COMPLETED", resource: { id: "CAPTURE1", supplementary_data: { related_ids: { order_id: "ORDER1" } } } }));
    const headers = new Headers({ "paypal-transmission-id": "tx", "paypal-transmission-time": "2026-10-08T00:00:00Z", "paypal-transmission-sig": "signature", "paypal-cert-url": "https://api.paypal.com/cert", "paypal-auth-algo": "SHA256withRSA" });
    expect(await createPayPalGateway(context(fetcher)).verifyWebhook(raw, headers)).toMatchObject({ eventId: "EVENT1", orderId: "ORDER1", bodyHash: createHash("sha256").update(raw).digest("hex") });
    expect(calls.at(-1)?.url).toBe("https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature");
    expect(JSON.parse(String(calls.at(-1)?.init?.body))).toMatchObject({ webhook_id: "registered", transmission_sig: "signature" });
  });
  it("rejects10 missing/tampered postbacks with zero accepted events", async () => {
    for (let i = 0; i < 10; i++) {
      const fetcher: typeof fetch = async (input) => String(input).endsWith("/token") ? json({ access_token: "token", expires_in: 3600 }) : json({ verification_status: "FAILURE" });
      const headers = new Headers(i < 5 ? {} : { "paypal-transmission-id": "tx", "paypal-transmission-time": "time", "paypal-transmission-sig": "tampered", "paypal-cert-url": "https://api.paypal.com/cert", "paypal-auth-algo": "SHA256withRSA" });
      await expect(createPayPalGateway(context(fetcher)).verifyWebhook(Buffer.from(JSON.stringify({ id: "EVENT", event_type: "PAYMENT.CAPTURE.COMPLETED", resource: { id: "CAPTURE" } })), headers)).rejects.toThrow();
    }
  });
});
