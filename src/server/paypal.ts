import { createHash } from "node:crypto";
import { PAYPAL_SANDBOX_ORIGIN } from "./config";
import type { HttpContext, PayPalGateway, ProviderCapture, ProviderOperation, ProviderOrder, VerifiedWebhook } from "./context";
import { AppError } from "./errors";

const MAX_BODY = 262144;
const TIMEOUT = 15000;
export const DISPATCH_MARGIN_MS = 30000;
interface Token { value: string; expiresAt: number }
interface Cache { token?: Token; pending?: Promise<Token> }
const caches = new WeakMap<typeof fetch, Map<string, Cache>>();
type Json = Record<string, unknown>;
const unavailable = () => new AppError("PROVIDER_UNAVAILABLE", "Payment provider unavailable. Reconcile before retrying.", 503);
function object(value: unknown): Json {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw unavailable();
  return value as Json;
}
function text(value: unknown, max = 256): string {
  if (typeof value !== "string" || value.length === 0 || value.length > max || /[\u0000-\u001f]/.test(value)) throw unavailable();
  return value;
}
function identifier(value: unknown): string {
  const id = text(value, 128);
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw unavailable();
  return id;
}
function money(value: unknown): { amountCents: number; currency: string } {
  const amount = object(value); const decimal = text(amount.value, 32);
  if (!/^(0|[1-9]\d*)\.\d{2}$/.test(decimal)) throw unavailable();
  const cents = Number(decimal.replace(".", ""));
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 100000000000) throw unavailable();
  return { amountCents: cents, currency: text(amount.currency_code, 3) };
}
function approval(value: unknown): string | null {
  if (value === undefined) return null;
  if (!Array.isArray(value) || value.length > 30) throw unavailable();
  const links = value.map(object).filter((link) => link.rel === "approve" || link.rel === "payer-action");
  if (links.length === 0) return null;
  if (links.length !== 1) throw unavailable();
  const href = text(links[0].href, 2048); let url: URL;
  try { url = new URL(href); } catch { throw unavailable(); }
  if (url.protocol !== "https:" || !["www.sandbox.paypal.com", "sandbox.paypal.com"].includes(url.hostname)
    || url.username || url.password || url.port || url.hash) throw unavailable();
  return href;
}
function normalize(value: unknown, expectedId?: string): ProviderOrder {
  const order = object(value); const id = identifier(order.id);
  if (expectedId && id !== expectedId) throw unavailable();
  if (!Array.isArray(order.purchase_units) || order.purchase_units.length !== 1) throw unavailable();
  const unit = object(order.purchase_units[0]); const merchantId = identifier(object(unit.payee).merchant_id);
  const amount = money(unit.amount); let captures: ProviderCapture[] = [];
  if (unit.payments !== undefined) {
    const payments = object(unit.payments);
    if (payments.captures !== undefined) {
      if (!Array.isArray(payments.captures) || payments.captures.length > 100) throw unavailable();
      captures = payments.captures.map((value) => {
        const capture = object(value);
        const related = capture.supplementary_data === undefined ? undefined : object(object(capture.supplementary_data).related_ids).order_id;
        // Nested canonical Orders GET binds captures to its purchase unit and payee.
        return { id: identifier(capture.id), status: text(capture.status, 40), orderId: related === undefined ? id : identifier(related),
          merchantId, ...money(capture.amount) };
      });
    }
  }
  return { id, status: text(order.status, 40), merchantId, ...amount, approvalUrl: approval(order.links), captures, provenance: "REAL_SANDBOX" };
}
function configured(ctx: HttpContext, webhook = false): void {
  if (![ctx.config.paypalClientId, ctx.config.paypalClientSecret, ctx.config.paypalMerchantId].every((value) => value.trim())
    || (webhook && (!ctx.config.paypalWebhookId.trim() || ctx.config.paypalWebhookId === "WEBHOOK_ID"))) {
    throw new AppError("CONFIG_REQUIRED", "Sandbox payment configuration required.", 503);
  }
}
function configuredOAuth(ctx: HttpContext): void {
  if (![ctx.config.paypalClientId, ctx.config.paypalClientSecret].every((value) => value.trim())) {
    throw new AppError("CONFIG_REQUIRED", "Sandbox app credentials required.", 503);
  }
}
async function request(ctx: HttpContext, path: string, init: RequestInit): Promise<Json> {
  const controller = new AbortController(); let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(unavailable()); }, TIMEOUT); });
  const run = async () => {
    const response = await (ctx.fetchImpl ?? fetch)(`${PAYPAL_SANDBOX_ORIGIN}${path}`, { ...init, redirect: "error", signal: controller.signal });
    if (!response.ok) { void response.body?.cancel().catch(() => {}); throw unavailable(); }
    const declared = response.headers.get("content-length");
    if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_BODY)) { void response.body?.cancel().catch(() => {}); throw unavailable(); }
    if (!response.body) throw unavailable();
    const reader = response.body.getReader(); const parts: Uint8Array[] = []; let length = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read(); if (done) break;
        length += value.byteLength;
        if (length > MAX_BODY) { void reader.cancel().catch(() => {}); throw unavailable(); }
        parts.push(value);
      }
    } finally { reader.releaseLock(); }
    const bytes = Buffer.concat(parts, length);
    return object(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
  };
  try { return await Promise.race([run(), deadline]); }
  catch { throw unavailable(); }
  finally { if (timer) clearTimeout(timer); }
}
async function accessToken(ctx: HttpContext): Promise<string> {
  configuredOAuth(ctx); const transport = ctx.fetchImpl ?? fetch;
  let map = caches.get(transport); if (!map) { map = new Map(); caches.set(transport, map); }
  const key = createHash("sha256").update(`${ctx.config.paypalClientId}\0${ctx.config.paypalClientSecret}`).digest("hex");
  let cache = map.get(key); if (!cache) { cache = {}; map.set(key, cache); }
  if (cache.token && cache.token.expiresAt > ctx.now()) return cache.token.value;
  if (!cache.pending) {
    const current = cache;
    current.pending = (async () => {
      const result = await request(ctx, "/v1/oauth2/token", { method: "POST", headers: { authorization: `Basic ${Buffer.from(`${ctx.config.paypalClientId}:${ctx.config.paypalClientSecret}`).toString("base64")}`, "content-type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" });
      const value = text(result.access_token, 8192); const seconds = result.expires_in;
      if (typeof seconds !== "number" || !Number.isSafeInteger(seconds) || seconds <= 60 || seconds > 86400) throw unavailable();
      return { value, expiresAt: ctx.now() + (seconds - 60) * 1000 };
    })();
    try { current.token = await current.pending; } finally { current.pending = undefined; }
  }
  // Expired token can coexist with a refresh. Every concurrent caller awaits it.
  return (cache.pending ? await cache.pending : cache.token!).value;
}
async function api(ctx: HttpContext, path: string, method: "GET" | "POST", payload?: Json, requestId?: string, retryUntil?: number): Promise<Json> {
  configured(ctx);
  const token = await accessToken(ctx);
  // OAuth can yield across the immutable retention boundary. Check at actual dispatch.
  if (requestId !== undefined && (!Number.isSafeInteger(retryUntil) || retryUntil! - ctx.now() <= DISPATCH_MARGIN_MS)) throw unavailable();
  return request(ctx, path, { method, headers: { authorization: `Bearer ${token}`, "content-type": "application/json", accept: "application/json", prefer: "return=representation", ...(requestId ? { "paypal-request-id": identifier(requestId) } : {}) }, ...(payload ? { body: JSON.stringify(payload) } : {}) });
}
export function createPayPalGateway(ctx: HttpContext): PayPalGateway {
  if (ctx.provider) return ctx.provider;
  const normalizeOrder = (value: unknown, expectedId?: string): ProviderOrder => ({ ...normalize(value, expectedId), provenance: ctx.fetchImpl ? "LOCAL_FIXTURE" : "REAL_SANDBOX" });
  const getOrder = async (orderId: string) => normalizeOrder(await api(ctx, `/v2/checkout/orders/${identifier(orderId)}`, "GET"), orderId);
  return {
    async createOrder(operation: ProviderOperation) { return normalizeOrder(await api(ctx, "/v2/checkout/orders", "POST", operation.payload, identifier(operation.requestId), operation.retryUntil)); },
    getOrder,
    async captureOrder(operation: ProviderOperation) {
      const id = identifier(operation.orderId);
      const response = await api(ctx, `/v2/checkout/orders/${id}/capture`, "POST", operation.payload, identifier(operation.requestId), operation.retryUntil);
      if (identifier(response.id) !== id) throw unavailable();
      // Capture representations can omit the purchase-unit amount/payee. Read canonical order.
      return getOrder(id);
    },
    async verifyWebhook(raw: Uint8Array, headers: Headers): Promise<VerifiedWebhook> {
      configured(ctx, true);
      if (raw.byteLength === 0 || raw.byteLength > MAX_BODY) throw new AppError("VALIDATION", "Invalid webhook event.", 400);
      let rawBody: string; let event: Json;
      try { rawBody = new TextDecoder("utf-8", { fatal: true }).decode(raw); event = object(JSON.parse(rawBody)); }
      catch { throw new AppError("VALIDATION", "Invalid webhook event.", 400); }
      const fields = { transmission_id: "paypal-transmission-id", transmission_time: "paypal-transmission-time", transmission_sig: "paypal-transmission-sig", cert_url: "paypal-cert-url", auth_algo: "paypal-auth-algo" };
      const verification: Json = { webhook_id: ctx.config.paypalWebhookId, webhook_event: event };
      for (const [key, header] of Object.entries(fields)) {
        const value = headers.get(header);
        if (!value || value.length > 8192 || /[\u0000-\u001f]/.test(value)) throw new AppError("UNAUTHENTICATED", "Webhook verification failed.", 401);
        verification[key] = value;
      }
      const result = await api(ctx, "/v1/notifications/verify-webhook-signature", "POST", verification);
      if (result.verification_status !== "SUCCESS") throw new AppError("UNAUTHENTICATED", "Webhook verification failed.", 401);
      const resource = object(event.resource);
      const orderId = resource.supplementary_data === undefined ? null : identifier(object(object(resource.supplementary_data).related_ids).order_id);
      return { eventId: identifier(event.id), eventType: text(event.event_type, 128), resourceId: identifier(resource.id), orderId, rawBody, bodyHash: createHash("sha256").update(raw).digest("hex") };
    },
  };
}
export async function checkPayPalAccess(ctx: HttpContext): Promise<{ authenticated: boolean; sandboxOnly: true }> {
  await accessToken(ctx); return { authenticated: true, sandboxOnly: true };
}
