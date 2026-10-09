import { createHash } from "node:crypto";
import type { HttpContext, VerifiedWebhook } from "./context";
import { transaction } from "./db";
import { AppError } from "./errors";
import { reconcileWebhookReceipt } from "./payments";
import { createPayPalGateway } from "./paypal";

const MAX_BODY = 262144;
interface Receipt { event_id: string; raw_body: string; body_hash: string; event_type: string }
function fromReceipt(row: Receipt): VerifiedWebhook {
  const event = JSON.parse(row.raw_body) as { id: string; event_type: string; resource: { id: string; supplementary_data?: { related_ids?: { order_id?: string } } } };
  return { eventId: row.event_id, eventType: row.event_type, resourceId: event.resource.id,
    orderId: event.resource.supplementary_data?.related_ids?.order_id ?? null, rawBody: row.raw_body, bodyHash: row.body_hash };
}
async function processReceipt(ctx: HttpContext, row: Receipt): Promise<void> {
  // Receipt was authenticated before its durable insertion. Provider outage keeps it pending.
  const result = await reconcileWebhookReceipt(ctx, fromReceipt(row));
  if (result === "pending") { deferReceipt(ctx, row.event_id); return; }
  ctx.db.prepare("UPDATE webhook_receipts SET processed_at = ?, disposition = ? WHERE event_id = ? AND processed_at IS NULL")
    .run(ctx.now(), result, row.event_id);
}
function deferReceipt(ctx: HttpContext, eventId: string): void {
  // Persist retry ordering so an unmatched event cannot monopolize bounded batches.
  ctx.db.prepare("UPDATE webhook_receipts SET disposition = ? WHERE event_id = ? AND processed_at IS NULL")
    .run(`pending:${ctx.now()}`, eventId);
}
export async function receiveWebhook(ctx: HttpContext, raw: Uint8Array, headers: Headers): Promise<{ status: 204 | 400 | 401 | 503 }> {
  if (raw.byteLength === 0 || raw.byteLength > MAX_BODY) return { status: 400 };
  let verified: VerifiedWebhook;
  try {
    verified = await createPayPalGateway(ctx).verifyWebhook(raw, headers);
    const rawBody = new TextDecoder("utf-8", { fatal: true }).decode(raw);
    const bodyHash = createHash("sha256").update(raw).digest("hex");
    const event = JSON.parse(rawBody) as { id?: unknown; event_type?: unknown; resource?: { id?: unknown } };
    if (!verified.eventId || !verified.eventType || !verified.resourceId || verified.rawBody !== rawBody || verified.bodyHash !== bodyHash
      || event.id !== verified.eventId || event.event_type !== verified.eventType || event.resource?.id !== verified.resourceId) return { status: 400 };
  } catch (error) {
    if (error instanceof AppError && error.code === "VALIDATION") return { status: 400 };
    if (error instanceof AppError && error.code === "UNAUTHENTICATED") return { status: 401 };
    return { status: 503 };
  }
  try {
    const accepted = transaction(ctx.db, () => {
      const previous = ctx.db.prepare("SELECT body_hash, raw_body FROM webhook_receipts WHERE event_id = ?").get(verified.eventId);
      if (previous) return previous.body_hash === verified.bodyHash && previous.raw_body === verified.rawBody;
      ctx.db.prepare(`INSERT INTO webhook_receipts (event_id, raw_body, body_hash, event_type, received_at, disposition)
        VALUES (?, ?, ?, ?, ?, 'pending')`).run(verified.eventId, verified.rawBody, verified.bodyHash, verified.eventType, ctx.now());
      return true;
    });
    if (!accepted) return { status: 400 };
  } catch { return { status: 503 }; }
  // Acknowledge only after durable persistence. Processing can resume after a crash.
  const row = ctx.db.prepare("SELECT * FROM webhook_receipts WHERE event_id = ? AND processed_at IS NULL").get(verified.eventId) as unknown as Receipt | undefined;
  if (row) { try { await processReceipt(ctx, row); } catch { /* Retained verified receipt resumes later. */ } }
  return { status: 204 };
}
export async function processReceipts(ctx: HttpContext, limit: number): Promise<void> {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new AppError("VALIDATION", "Invalid receipt batch size.", 400);
  const rows = ctx.db.prepare(`SELECT * FROM webhook_receipts WHERE processed_at IS NULL
    ORDER BY CASE WHEN disposition LIKE 'pending:%' THEN CAST(SUBSTR(disposition, 9) AS INTEGER) ELSE 0 END, received_at, event_id LIMIT ?`).all(limit) as unknown as Receipt[];
  for (const row of rows) {
    try { await processReceipt(ctx, row); }
    catch { try { deferReceipt(ctx, row.event_id); } catch { /* Storage outage keeps original durable receipt. */ } }
  }
}
