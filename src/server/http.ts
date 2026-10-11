import { z } from "zod";
import type { HttpContext } from "./context";
import { LIMITS } from "../shared/contracts";
import { AppError } from "./errors";
import { getConfig } from "./config";
import { getDatabase } from "./db";
import { bootstrapCsrf, login, logout, requireOwnerRead, requireOwnerMutation, requireBuyerRead, requireBuyerMutation } from "./auth";
import { createEngagement, listEngagements, getEngagement, saveDraft, approve } from "./engagements";
import { issueCheckout, revokeCheckout, getBuyer, createOrder, captureOrder, observeCancel, reconcile } from "./payments";
import { receiveWebhook } from "./webhooks";
import { extractScope } from "./extraction";
import { startMaintenance } from "./maintenance";

const text = z.string().max(LIMITS.textChars);
const question = z.object({ id: z.string().min(1).max(64), text, blocking: z.boolean(), answer: text.nullable() }).strict();
const draft = z.object({
  brief: z.string().max(LIMITS.briefChars), goal: text,
  deliverables: z.array(text).max(LIMITS.items), timing: text.nullable(),
  constraints: z.array(text).max(LIMITS.items), assumptions: z.array(text).max(LIMITS.items),
  questions: z.array(question).max(LIMITS.items),
  items: z.array(z.object({ description: text, quantity: z.number().int().min(1).max(LIMITS.quantity), unitCents: z.number().int().min(0).max(LIMITS.unitCents) }).strict()).max(LIMITS.items),
  depositCents: z.number().int().min(0).max(LIMITS.totalCents),
}).strict();
const version = z.number().int().min(1).max(Number.MAX_SAFE_INTEGER - 1);
const empty = z.object({}).strict();
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function readBounded(request: Request, limit: number): Promise<Uint8Array> {
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > limit)) throw new AppError("VALIDATION", "Request too large.", 413);
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new AppError("VALIDATION", "Request too large.", 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}
async function body<T>(ctx: HttpContext, schema: z.ZodType<T>): Promise<T> {
  if (ctx.request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new AppError("VALIDATION", "JSON body required.", 415);
  const bytes = await readBounded(ctx.request, 1024 * 1024);
  let value: unknown;
  try { value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw new AppError("VALIDATION", "Invalid JSON body.", 400); }
  const result = schema.safeParse(value);
  if (!result.success) throw new AppError("VALIDATION", "Invalid request fields.", 400);
  return result.data;
}
function headers(ctx: HttpContext): Headers {
  const result = new Headers(ctx.responseHeaders);
  result.set("Cache-Control", "no-store");
  result.set("Referrer-Policy", "no-referrer");
  result.set("X-Content-Type-Options", "nosniff");
  result.set("X-Frame-Options", "DENY");
  return result;
}
function json(ctx: HttpContext, value: unknown, status = 200): Response {
  const responseHeaders = headers(ctx);
  responseHeaders.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(value), { status, headers: responseHeaders });
}
function paymentStatus(value: { state: string }): number { return ["pending", "uncertain", "creating", "capturing"].includes(value.state) ? 202 : 200; }

export async function dispatchApi(ctx: HttpContext): Promise<Response> {
  try {
    const request = ctx.request;
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    if (path === "/api/webhooks/paypal" && method === "POST") {
      const result = await receiveWebhook(ctx, await readBounded(request, 256 * 1024), request.headers);
      return new Response(null, { status: result.status, headers: headers(ctx) });
    }
    if (path === "/api/health" && method === "GET") {
      return json(ctx, { sandboxOnly: true, paypalConfigured: Boolean(ctx.config.paypalClientId && ctx.config.paypalClientSecret && ctx.config.paypalMerchantId), webhookConfigured: Boolean(ctx.config.paypalWebhookId), aiConfigured: Boolean(ctx.config.vyceApiKey), aiUsageEnabled: ctx.config.aiUsageEnabled });
    }
    if (path === "/api/session") {
      if (method === "GET") return json(ctx, bootstrapCsrf(ctx));
      if (method === "POST") return json(ctx, await login(ctx, await body(ctx, z.object({ username: z.string().min(1).max(100), password: z.string().min(1).max(1024) }).strict())));
      if (method === "DELETE") { requireOwnerMutation(ctx); await body(ctx, empty); return json(ctx, logout(ctx)); }
    }
    if (path === "/api/engagements") {
      if (method === "GET") return json(ctx, { engagements: listEngagements(ctx, requireOwnerRead(ctx)) });
      if (method === "POST") { const owner = requireOwnerMutation(ctx); await body(ctx, empty); return json(ctx, createEngagement(ctx, owner), 201); }
    }
    const engagementPath = path.match(/^\/api\/engagements\/([^/]+)(?:\/(draft|approve|checkout|reconcile))?$/);
    if (engagementPath && idPattern.test(engagementPath[1])) {
      const id = engagementPath[1];
      const action = engagementPath[2];
      if (!action && method === "GET") return json(ctx, getEngagement(ctx, requireOwnerRead(ctx), id));
      if (action === "draft" && method === "PUT") { const owner = requireOwnerMutation(ctx); return json(ctx, saveDraft(ctx, owner, id, await body(ctx, z.object({ expectedVersion: version, draft }).strict()))); }
      if (action === "approve" && method === "POST") { const owner = requireOwnerMutation(ctx); return json(ctx, approve(ctx, owner, id, await body(ctx, z.object({ expectedVersion: version }).strict()))); }
      if (action === "checkout" && method === "POST") { const owner = requireOwnerMutation(ctx); return json(ctx, issueCheckout(ctx, owner, id, await body(ctx, z.object({ quoteId: z.string().regex(idPattern) }).strict()))); }
      if (action === "reconcile" && method === "POST") { const owner = requireOwnerMutation(ctx); await body(ctx, empty); const value = await reconcile(ctx, owner, id); return json(ctx, value, paymentStatus(value)); }
    }
    const capabilityPath = path.match(/^\/api\/capabilities\/([^/]+)$/);
    if (capabilityPath && idPattern.test(capabilityPath[1]) && method === "DELETE") { const owner = requireOwnerMutation(ctx); await body(ctx, empty); revokeCheckout(ctx, owner, capabilityPath[1]); return json(ctx, { revoked: true }); }
    if (path === "/api/extract" && method === "POST") { requireOwnerMutation(ctx); const input = await body(ctx, z.object({ brief: z.string().min(1).max(LIMITS.briefChars) }).strict()); return json(ctx, await extractScope(ctx, input.brief)); }
    if (path === "/api/buyer" && method === "GET") return json(ctx, getBuyer(ctx, requireBuyerRead(ctx)));
    if (["/api/buyer/order", "/api/buyer/capture", "/api/buyer/cancel"].includes(path) && method === "POST") {
      const buyer = requireBuyerMutation(ctx); await body(ctx, empty);
      if (path.endsWith("/order")) { const value = await createOrder(ctx, buyer); return json(ctx, value, paymentStatus(value.payment)); }
      const value = path.endsWith("/capture") ? await captureOrder(ctx, buyer) : observeCancel(ctx, buyer);
      return json(ctx, value, paymentStatus(value));
    }
    throw new AppError("NOT_FOUND", "Route not found.", 404);
  } catch (error) {
    if (error instanceof AppError) return json(ctx, { error: { code: error.code, message: error.message } }, error.status);
    return json(ctx, { error: { code: "PROVIDER_UNAVAILABLE", message: "Request could not be completed." } }, 503);
  }
}
export async function handleApi(request: Request): Promise<Response> {
  try {
    const config = getConfig();
    const ctx: HttpContext = { request, config, db: getDatabase(config), now: Date.now, responseHeaders: new Headers() };
    startMaintenance(ctx);
    return await dispatchApi(ctx);
  } catch {
    return Response.json({ error: { code: "CONFIG_REQUIRED", message: "Local server configuration unavailable." } }, { status: 503, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  }
}
