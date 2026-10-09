import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { ApprovedQuote, AttemptState, BuyerDto, CheckoutDto, CheckoutLink, PaymentDto } from "../shared/contracts";
import { requireBuyerMutation, requireBuyerRead, requireOwnerMutation, requireOwnerRead } from "./auth";
import type { BuyerPrincipal, HttpContext, OwnerPrincipal, ProviderOperation, ProviderOrder, VerifiedWebhook } from "./context";
import { transaction } from "./db";
import { AppError } from "./errors";
import { createPayPalGateway, DISPATCH_MARGIN_MS } from "./paypal";

const LEASE_MS = 30000;
const RETENTION_MS = 21600000;
const CAPABILITY_MS = 86400000;
const recoveryCursors = new WeakMap<HttpContext["db"], { createdAt: number; id: string }>();
interface Attempt {
  id: string; engagement_id: string; quote_id: string; merchant_id: string; deposit_cents: number; currency: string;
  order_id: string | null; state: AttemptState; guard_held: number; cancel_observed_at: number | null; created_at: number;
}
interface Operation {
  kind: "create" | "capture"; request_id: string; payload_json: string; status: string;
  first_dispatched_at: number | null; retry_until: number | null; lease_until: number | null;
}
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const conflict = () => new AppError("CONFLICT", "Existing deposit must be reconciled before checkout.", 409);
const missing = () => new AppError("NOT_FOUND", "Checkout not found.", 404);
function configuration(ctx: HttpContext): void {
  if (![ctx.config.paypalClientId, ctx.config.paypalClientSecret, ctx.config.paypalMerchantId].every((value) => value.trim())) {
    throw new AppError("CONFIG_REQUIRED", "Sandbox payment configuration required.", 503);
  }
}
function assertOwner(ctx: HttpContext, owner: OwnerPrincipal, mutation = false): void {
  const current = mutation ? requireOwnerMutation(ctx) : requireOwnerRead(ctx);
  if (current.ownerId !== owner.ownerId) throw new AppError("FORBIDDEN", "Access denied.", 403);
}
function assertBuyer(ctx: HttpContext, buyer: BuyerPrincipal, mutation = false): Attempt {
  const current = mutation ? requireBuyerMutation(ctx) : requireBuyerRead(ctx);
  if (current.capabilityId !== buyer.capabilityId || current.attemptId !== buyer.attemptId || current.quoteId !== buyer.quoteId) {
    throw new AppError("FORBIDDEN", "Access denied.", 403);
  }
  return attempt(ctx, current.attemptId);
}
function attempt(ctx: HttpContext, id: string): Attempt {
  const value = ctx.db.prepare("SELECT * FROM attempts WHERE id = ?").get(id) as unknown as Attempt | undefined;
  if (!value) throw missing(); return value;
}
function operation(ctx: HttpContext, id: string, kind: Operation["kind"]): Operation {
  const value = ctx.db.prepare("SELECT * FROM operations WHERE attempt_id = ? AND kind = ?").get(id, kind) as unknown as Operation | undefined;
  if (!value) throw conflict(); return value;
}
function payment(ctx: HttpContext, id: string): PaymentDto {
  const value = attempt(ctx, id);
  const paid = ctx.db.prepare("SELECT verified_at FROM paid_deposits WHERE attempt_id = ?").get(id);
  const operations = ctx.db.prepare("SELECT * FROM operations WHERE attempt_id = ?").all(id) as unknown as Operation[];
  const now = ctx.now();
  const retryAllowed = !paid && value.guard_held === 1 && operations.some((item) => item.status !== "completed" && item.status !== "failed"
    && (item.lease_until === null || item.lease_until <= now) && (item.retry_until === null || now + DISPATCH_MARGIN_MS < item.retry_until)
    && (item.kind === "create" ? value.order_id === null : value.order_id !== null));
  return { state: paid ? "paid" : value.state, paid: Boolean(paid), retryAllowed, cancelObserved: value.cancel_observed_at !== null,
    depositCents: value.deposit_cents, currency: "USD", verifiedAt: paid ? paid.verified_at as number : null };
}
function ownedAttempt(ctx: HttpContext, owner: OwnerPrincipal, id: string): Attempt {
  const engagement = ctx.db.prepare("SELECT id FROM engagements WHERE id = ? AND owner_id = ?").get(id, owner.ownerId);
  if (!engagement) throw missing();
  const value = ctx.db.prepare("SELECT * FROM attempts WHERE engagement_id = ? ORDER BY guard_held DESC, created_at DESC, id DESC LIMIT 1").get(id) as unknown as Attempt | undefined;
  if (!value) throw missing(); return value;
}
function validApproval(ctx: HttpContext, value: Attempt, unusedOnly = false): void {
  const row = ctx.db.prepare(`SELECT q.snapshot_json, q.deposit_cents, q.currency, e.active_quote_id FROM quotes q
    JOIN engagements e ON e.id = q.engagement_id WHERE q.id = ? AND q.engagement_id = ?`).get(value.quote_id, value.engagement_id);
  if (!row || row.deposit_cents !== value.deposit_cents || row.currency !== "USD") throw conflict();
  const quote = JSON.parse(row.snapshot_json as string) as ApprovedQuote;
  if (quote.quoteId !== value.quote_id || quote.depositCents !== value.deposit_cents || quote.currency !== "USD"
    || !Array.isArray(quote.questions) || quote.questions.some((question) => question.blocking && !question.answer?.trim())) throw conflict();
  if (unusedOnly && row.active_quote_id !== value.quote_id) throw conflict();
}
function createPayload(ctx: HttpContext, quoteId: string, cents: number): Record<string, unknown> {
  const amount = `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
  return { intent: "CAPTURE", purchase_units: [{ reference_id: quoteId, amount: { currency_code: "USD", value: amount }, payee: { merchant_id: ctx.config.paypalMerchantId } }],
    application_context: { return_url: `${ctx.config.appOrigin}/pay?approved=1`, cancel_url: `${ctx.config.appOrigin}/pay?canceled=1`, user_action: "PAY_NOW" } };
}
export function issueCheckout(ctx: HttpContext, owner: OwnerPrincipal, id: string, input: { quoteId: string }): CheckoutLink {
  assertOwner(ctx, owner, true); configuration(ctx);
  if (!input || typeof input.quoteId !== "string" || Object.keys(input).length !== 1 || input.quoteId.length > 128) {
    throw new AppError("VALIDATION", "Invalid checkout input.", 400);
  }
  return transaction(ctx.db, () => {
    const quote = ctx.db.prepare(`SELECT q.* FROM quotes q JOIN engagements e ON e.id = q.engagement_id
      WHERE q.id = ? AND e.id = ? AND e.owner_id = ? AND e.active_quote_id = q.id`).get(input.quoteId, id, owner.ownerId);
    if (!quote) throw missing();
    if (ctx.db.prepare("SELECT 1 FROM attempts WHERE engagement_id = ? AND guard_held = 1").get(id)
      || ctx.db.prepare("SELECT 1 FROM paid_deposits WHERE engagement_id = ?").get(id)) throw conflict();
    const attemptId = randomUUID(); const capabilityId = randomUUID(); const now = ctx.now(); const token = randomBytes(32).toString("base64url"); const expiresAt = now + CAPABILITY_MS;
    ctx.db.prepare(`INSERT INTO attempts (id, engagement_id, quote_id, merchant_id, deposit_cents, currency, state, guard_held, created_at)
      VALUES (?, ?, ?, ?, ?, 'USD', 'reserved', 1, ?)`).run(attemptId, id, input.quoteId, ctx.config.paypalMerchantId, quote.deposit_cents as number, now);
    validApproval(ctx, attempt(ctx, attemptId), true);
    for (const kind of ["create", "capture"] as const) {
      const payload = JSON.stringify(kind === "create" ? createPayload(ctx, input.quoteId, quote.deposit_cents as number) : {});
      ctx.db.prepare("INSERT INTO operations (attempt_id, kind, request_id, payload_json, payload_hash, status) VALUES (?, ?, ?, ?, ?, 'ready')")
        .run(attemptId, kind, randomUUID(), payload, hash(payload));
    }
    ctx.db.prepare("INSERT INTO capabilities (id, token_hash, attempt_id, quote_id, expires_at) VALUES (?, ?, ?, ?, ?)")
      .run(capabilityId, hash(token), attemptId, input.quoteId, expiresAt);
    return { capabilityId, checkoutUrl: `${ctx.config.appOrigin}/pay#${token}`, expiresAt };
  });
}
export function revokeCheckout(ctx: HttpContext, owner: OwnerPrincipal, capabilityId: string): void {
  assertOwner(ctx, owner, true);
  const result = ctx.db.prepare(`UPDATE capabilities SET revoked_at = COALESCE(revoked_at, ?) WHERE id = ? AND attempt_id IN
    (SELECT a.id FROM attempts a JOIN engagements e ON e.id = a.engagement_id WHERE e.owner_id = ?)`).run(ctx.now(), capabilityId, owner.ownerId);
  if (result.changes !== 1) throw missing();
}
export function getBuyer(ctx: HttpContext, buyer: BuyerPrincipal): BuyerDto {
  const value = assertBuyer(ctx, buyer);
  const row = ctx.db.prepare("SELECT snapshot_json FROM quotes WHERE id = ? AND engagement_id = ?").get(value.quote_id, value.engagement_id);
  if (!row) throw missing();
  return { quote: JSON.parse(row.snapshot_json as string) as ApprovedQuote, payment: payment(ctx, value.id) };
}
function acquire(ctx: HttpContext, buyer: BuyerPrincipal, kind: Operation["kind"]): ProviderOperation | null {
  return transaction(ctx.db, () => {
    const value = assertBuyer(ctx, buyer, true); configuration(ctx);
    if (value.state === "paid" || value.guard_held !== 1 || value.state === "terminal_unpaid") return null;
    const op = operation(ctx, value.id, kind); const now = ctx.now();
    validApproval(ctx, value, kind === "create" && op.first_dispatched_at === null);
    if (value.merchant_id !== ctx.config.paypalMerchantId) throw conflict();
    if (op.status === "completed" || op.status === "failed" || (op.lease_until !== null && op.lease_until > now)
      || (op.retry_until !== null && now + DISPATCH_MARGIN_MS >= op.retry_until) || (kind === "capture" && !value.order_id)) return null;
    if (kind === "create" && value.order_id) return null;
    ctx.db.prepare(`UPDATE operations SET first_dispatched_at = COALESCE(first_dispatched_at, ?), retry_until = COALESCE(retry_until, ?),
      status = 'dispatched', lease_until = ? WHERE attempt_id = ? AND kind = ?`).run(now, now + RETENTION_MS, now + LEASE_MS, value.id, kind);
    ctx.db.prepare("UPDATE attempts SET state = ?, version = version + 1 WHERE id = ? AND state != 'paid'").run(kind === "create" ? "creating" : "capturing", value.id);
    return { requestId: op.request_id, retryUntil: op.retry_until ?? now + RETENTION_MS, payload: JSON.parse(op.payload_json) as Record<string, unknown>, ...(value.order_id ? { orderId: value.order_id } : {}) };
  });
}
function uncertain(ctx: HttpContext, id: string, kind: Operation["kind"]): void {
  transaction(ctx.db, () => {
    ctx.db.prepare("UPDATE operations SET status = 'uncertain', lease_until = NULL WHERE attempt_id = ? AND kind = ? AND status != 'completed'").run(id, kind);
    ctx.db.prepare("UPDATE attempts SET state = 'uncertain', version = version + 1 WHERE id = ? AND state NOT IN ('paid', 'terminal_unpaid')").run(id);
  });
}
function bound(value: Attempt, order: ProviderOrder): boolean {
  return order && order.id === value.order_id && order.merchantId === value.merchant_id && order.amountCents === value.deposit_cents && order.currency === "USD";
}
function applyEvidence(ctx: HttpContext, id: string, order: ProviderOrder, expectedCaptureId?: string): "paid" | "unpaid" | "rejected" {
  return transaction(ctx.db, () => {
    const value = attempt(ctx, id);
    if (value.state === "paid") return "paid";
    if (!bound(value, order) || value.merchant_id !== ctx.config.paypalMerchantId || !Array.isArray(order.captures)) return "rejected";
    const capture = order.captures.length === 1 ? order.captures[0] : undefined;
    if (capture?.status === "COMPLETED" && capture.id && capture.orderId === value.order_id && capture.merchantId === value.merchant_id
      && capture.amountCents === value.deposit_cents && capture.currency === "USD" && (!expectedCaptureId || capture.id === expectedCaptureId)
      && ["LOCAL_FIXTURE", "REAL_SANDBOX"].includes(order.provenance)) {
      if (ctx.db.prepare("SELECT 1 FROM paid_deposits WHERE capture_id = ? OR engagement_id = ?").get(capture.id, value.engagement_id)) return "rejected";
      ctx.db.prepare(`INSERT INTO paid_deposits (engagement_id, attempt_id, capture_id, order_id, merchant_id, amount_cents, currency, verified_at, provenance, evidence_json)
        VALUES (?, ?, ?, ?, ?, ?, 'USD', ?, ?, ?)`).run(value.engagement_id, value.id, capture.id, value.order_id!, value.merchant_id, value.deposit_cents, ctx.now(), order.provenance, JSON.stringify(order));
      ctx.db.prepare("UPDATE attempts SET state = 'paid', guard_held = 1, version = version + 1 WHERE id = ?").run(id);
      ctx.db.prepare("UPDATE operations SET status = 'completed', lease_until = NULL WHERE attempt_id = ?").run(id);
      return "paid";
    }
    if (order.captures.length > 0) {
      const pending = order.captures.every((item) => item.status === "PENDING" && item.orderId === value.order_id && item.merchantId === value.merchant_id && item.amountCents === value.deposit_cents && item.currency === "USD");
      if (pending) ctx.db.prepare("UPDATE attempts SET state = 'pending', version = version + 1 WHERE id = ? AND state != 'paid'").run(id);
      return "rejected";
    }
    if (order.status === "VOIDED" && !ctx.db.prepare("SELECT 1 FROM operations WHERE attempt_id = ? AND lease_until > ?").get(id, ctx.now())) {
      ctx.db.prepare("UPDATE attempts SET state = 'terminal_unpaid', guard_held = 0, version = version + 1 WHERE id = ? AND state != 'paid'").run(id);
      ctx.db.prepare("UPDATE operations SET status = 'failed', lease_until = NULL WHERE attempt_id = ? AND status != 'completed'").run(id);
      return "unpaid";
    }
    return "rejected";
  });
}
function safeApproval(order: ProviderOrder): string | null {
  if (!order.approvalUrl) return null;
  let url: URL; try { url = new URL(order.approvalUrl); } catch { return null; }
  return url.protocol === "https:" && ["www.sandbox.paypal.com", "sandbox.paypal.com"].includes(url.hostname)
    && !url.username && !url.password && !url.port && !url.hash ? order.approvalUrl : null;
}
export async function createOrder(ctx: HttpContext, buyer: BuyerPrincipal): Promise<CheckoutDto> {
  const value = assertBuyer(ctx, buyer, true); configuration(ctx); const gateway = createPayPalGateway(ctx);
  const op = acquire(ctx, buyer, "create"); let approvalUrl: string | null = null;
  try {
    if (op) {
      const order = await gateway.createOrder(op);
      if (!order?.id || order.merchantId !== value.merchant_id || order.amountCents !== value.deposit_cents || order.currency !== "USD") throw conflict();
      transaction(ctx.db, () => {
        const current = attempt(ctx, value.id);
        if (current.order_id && current.order_id !== order.id) throw conflict();
        ctx.db.prepare("UPDATE attempts SET order_id = ?, state = CASE WHEN state = 'paid' THEN state ELSE 'awaiting_buyer' END, version = version + 1 WHERE id = ?").run(order.id, value.id);
        ctx.db.prepare("UPDATE operations SET status = 'completed', lease_until = NULL WHERE attempt_id = ? AND kind = 'create'").run(value.id);
      });
      const canonical = await gateway.getOrder(order.id);
      if (bound(attempt(ctx, value.id), canonical)) { approvalUrl = safeApproval(canonical); applyEvidence(ctx, value.id, canonical); }
    } else {
      const current = attempt(ctx, value.id);
      if (current.order_id && current.state !== "paid") {
        const canonical = await gateway.getOrder(current.order_id);
        if (bound(current, canonical)) { approvalUrl = safeApproval(canonical); applyEvidence(ctx, value.id, canonical); }
      }
    }
  } catch { if (op) uncertain(ctx, value.id, "create"); }
  return { payment: payment(ctx, value.id), approvalUrl };
}
export async function captureOrder(ctx: HttpContext, buyer: BuyerPrincipal): Promise<PaymentDto> {
  const value = assertBuyer(ctx, buyer, true); configuration(ctx);
  if (value.state === "paid" || !value.order_id || value.guard_held !== 1) return payment(ctx, value.id);
  const gateway = createPayPalGateway(ctx);
  let canonical: ProviderOrder;
  try { canonical = await gateway.getOrder(value.order_id); }
  catch { return payment(ctx, value.id); }
  applyEvidence(ctx, value.id, canonical);
  if (attempt(ctx, value.id).state === "paid" || !bound(value, canonical) || canonical.status !== "APPROVED" || canonical.captures.length > 0) return payment(ctx, value.id);
  const op = acquire(ctx, buyer, "capture");
  if (!op) return payment(ctx, value.id);
  try {
    await gateway.captureOrder(op);
    const result = await gateway.getOrder(value.order_id);
    applyEvidence(ctx, value.id, result);
    transaction(ctx.db, () => {
      const current = attempt(ctx, value.id);
      if (current.state !== "paid") {
        ctx.db.prepare("UPDATE operations SET status = 'uncertain', lease_until = NULL WHERE attempt_id = ? AND kind = 'capture'").run(value.id);
        ctx.db.prepare("UPDATE attempts SET state = CASE WHEN state = 'pending' THEN state ELSE 'uncertain' END, version = version + 1 WHERE id = ? AND state != 'terminal_unpaid'").run(value.id);
      }
    });
  } catch { uncertain(ctx, value.id, "capture"); }
  return payment(ctx, value.id);
}
export function observeCancel(ctx: HttpContext, buyer: BuyerPrincipal): PaymentDto {
  const value = assertBuyer(ctx, buyer, true);
  ctx.db.prepare("UPDATE attempts SET cancel_observed_at = COALESCE(cancel_observed_at, ?), version = version + 1 WHERE id = ?").run(ctx.now(), value.id);
  return payment(ctx, value.id);
}
async function reconcileAttempt(ctx: HttpContext, value: Attempt, expectedCaptureId?: string): Promise<"paid" | "unpaid" | "rejected"> {
  if (!value.order_id) return "rejected";
  const order = await createPayPalGateway(ctx).getOrder(value.order_id);
  return applyEvidence(ctx, value.id, order, expectedCaptureId);
}
export async function reconcile(ctx: HttpContext, owner: OwnerPrincipal, id: string): Promise<PaymentDto> {
  assertOwner(ctx, owner, true); configuration(ctx); const value = ownedAttempt(ctx, owner, id);
  try { await reconcileAttempt(ctx, value); } catch { /* Unavailable evidence never releases guard. */ }
  return payment(ctx, value.id);
}
export async function recoverUnresolved(ctx: HttpContext): Promise<void> {
  configuration(ctx);
  const eligible = "guard_held = 1 AND state != 'paid' AND order_id IS NOT NULL";
  const cursor = recoveryCursors.get(ctx.db);
  const rows = (cursor ? ctx.db.prepare(`SELECT * FROM attempts WHERE ${eligible}
    AND (created_at > ? OR (created_at = ? AND id > ?)) ORDER BY created_at, id LIMIT 20`)
    .all(cursor.createdAt, cursor.createdAt, cursor.id)
    : ctx.db.prepare(`SELECT * FROM attempts WHERE ${eligible} ORDER BY created_at, id LIMIT 20`).all()) as unknown as Attempt[];
  if (cursor && rows.length < 20) {
    const wrapped = ctx.db.prepare(`SELECT * FROM attempts WHERE ${eligible}
      AND (created_at < ? OR (created_at = ? AND id <= ?)) ORDER BY created_at, id LIMIT ?`)
      .all(cursor.createdAt, cursor.createdAt, cursor.id, 20 - rows.length) as unknown as Attempt[];
    rows.push(...wrapped);
  }
  // Advance before await: unchanged orders and failures cannot monopolize the next batch.
  const last = rows.at(-1);
  if (last) recoveryCursors.set(ctx.db, { createdAt: last.created_at, id: last.id });
  // Process-local cursor resets on restart; persisted unresolved attempts remain recoverable.
  for (const value of rows) { try { await reconcileAttempt(ctx, value); } catch { /* Later maintenance or webhook retries. */ } }
}
/** @internal Only trusted, verified, persisted webhook receipts. No capture dispatch. */
export async function reconcileWebhookReceipt(ctx: HttpContext, receipt: VerifiedWebhook): Promise<"paid" | "unpaid" | "rejected" | "pending"> {
  configuration(ctx);
  const stored = ctx.db.prepare("SELECT body_hash, raw_body, event_type FROM webhook_receipts WHERE event_id = ?").get(receipt.eventId);
  if (!stored || stored.body_hash !== receipt.bodyHash || stored.raw_body !== receipt.rawBody || stored.event_type !== receipt.eventType) throw conflict();
  if (receipt.eventType !== "PAYMENT.CAPTURE.COMPLETED" || !receipt.orderId) return "rejected";
  const value = ctx.db.prepare("SELECT * FROM attempts WHERE order_id = ?").get(receipt.orderId) as unknown as Attempt | undefined;
  // Event delivery can outrun persistence of the create response's order binding.
  if (!value) return "pending";
  const order = await createPayPalGateway(ctx).getOrder(value.order_id!);
  if (!bound(value, order)) return "rejected";
  if (order.captures.length === 0 || order.captures.every((capture) => capture.status === "PENDING")) return "pending";
  return applyEvidence(ctx, value.id, order, receipt.resourceId);
}
