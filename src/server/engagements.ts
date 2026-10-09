import { randomUUID } from "node:crypto";
import { z } from "zod";
import { LIMITS, type ApprovedQuote, type DraftInput, type EngagementDto, type PaymentDto } from "../shared/contracts";
import { requireOwnerMutation, requireOwnerRead } from "./auth";
import type { HttpContext, OwnerPrincipal } from "./context";
import { transaction } from "./db";
import { AppError } from "./errors";

const text = z.string().max(LIMITS.textChars);
const texts = z.array(text).max(100);
const draftSchema = z.strictObject({
  brief: z.string().max(LIMITS.briefChars), goal: text, deliverables: texts, timing: text.nullable(),
  constraints: texts, assumptions: texts,
  questions: z.array(z.strictObject({ id: z.string().min(1).max(64), text, blocking: z.boolean(), answer: text.nullable() })).max(100),
  items: z.array(z.strictObject({ description: text, quantity: z.number().int().min(1).max(LIMITS.quantity), unitCents: z.number().int().min(0).max(LIMITS.unitCents) })).max(LIMITS.items),
  depositCents: z.number().int().min(0).max(LIMITS.totalCents),
});
const version = z.number().int().min(1).max(Number.MAX_SAFE_INTEGER - 1);
const saveSchema = z.strictObject({ expectedVersion: version, draft: draftSchema });
const approveSchema = z.strictObject({ expectedVersion: version });

interface EngagementRow { id: string; owner_id: string; active_quote_id: string | null; created_at: number; version: number; draft_json: string }
interface AttemptRow { id: string; state: PaymentDto["state"]; deposit_cents: number; cancel_observed_at: number | null; verified_at: number | null }

function assertPrincipal(ctx: HttpContext, owner: OwnerPrincipal, mutation = false): void {
  const actual = mutation ? requireOwnerMutation(ctx) : requireOwnerRead(ctx);
  if (actual.ownerId !== owner.ownerId) throw new AppError("FORBIDDEN", "Access denied.", 403);
}

function owned(ctx: HttpContext, owner: OwnerPrincipal, id: string): EngagementRow {
  if (typeof id !== "string" || id.length > 128) throw new AppError("NOT_FOUND", "Engagement not found.", 404);
  const row = ctx.db.prepare(`SELECT e.*, d.version, d.draft_json FROM engagements e
    JOIN drafts d ON d.engagement_id = e.id WHERE e.id = ? AND e.owner_id = ?`)
    .get(id, owner.ownerId) as unknown as EngagementRow | undefined;
  if (!row) throw new AppError("NOT_FOUND", "Engagement not found.", 404);
  return row;
}

function dto(ctx: HttpContext, row: EngagementRow): EngagementDto {
  let quote: ApprovedQuote | null = null;
  if (row.active_quote_id) {
    const snapshot = ctx.db.prepare("SELECT snapshot_json FROM quotes WHERE id = ? AND engagement_id = ?")
      .get(row.active_quote_id, row.id);
    if (snapshot) quote = JSON.parse(snapshot.snapshot_json as string) as ApprovedQuote;
  }
  const attempt = ctx.db.prepare(`SELECT a.id, a.state, a.deposit_cents, a.cancel_observed_at, p.verified_at
    FROM attempts a LEFT JOIN paid_deposits p ON p.attempt_id = a.id
    WHERE a.engagement_id = ? ORDER BY a.guard_held DESC, a.created_at DESC, a.id DESC LIMIT 1`)
    .get(row.id) as unknown as AttemptRow | undefined;
  const payment: PaymentDto | null = attempt ? {
    state: attempt.verified_at !== null ? "paid" : attempt.state,
    paid: attempt.verified_at !== null,
    // Provider retry authorization belongs to payments, never to a draft read.
    retryAllowed: false, cancelObserved: attempt.cancel_observed_at !== null,
    depositCents: attempt.deposit_cents, currency: "USD", verifiedAt: attempt.verified_at,
  } : null;
  return { engagementId: row.id, draftVersion: row.version, draft: JSON.parse(row.draft_json) as DraftInput, quote, payment, createdAt: row.created_at };
}

function total(draft: DraftInput): number {
  let cents = 0;
  for (const item of draft.items) {
    const line = item.quantity * item.unitCents;
    cents += line;
    if (!Number.isSafeInteger(line) || !Number.isSafeInteger(cents) || cents > LIMITS.totalCents) {
      throw new AppError("VALIDATION", "Quote total exceeds allowed limits.", 400);
    }
  }
  return cents;
}

function checkVersion(row: EngagementRow, expected: number): void {
  if (row.version !== expected) throw new AppError("CONFLICT", "Draft changed. Reload and try again.", 409);
}

function retireUnused(ctx: HttpContext, engagementId: string): void {
  // Only never-dispatched reserved work is safe to retire. No provider call can be in flight.
  const unused = `SELECT a.id FROM attempts a WHERE a.engagement_id = ? AND a.state = 'reserved'
    AND a.order_id IS NULL AND NOT EXISTS (SELECT 1 FROM operations o WHERE o.attempt_id = a.id AND o.first_dispatched_at IS NOT NULL)`;
  ctx.db.prepare(`UPDATE capabilities SET revoked_at = ? WHERE revoked_at IS NULL AND attempt_id IN (${unused})`)
    .run(ctx.now(), engagementId);
  ctx.db.prepare(`UPDATE attempts SET state = 'terminal_unpaid', guard_held = 0, version = version + 1 WHERE id IN (${unused})`)
    .run(engagementId);
}

export function createEngagement(ctx: HttpContext, owner: OwnerPrincipal): EngagementDto {
  assertPrincipal(ctx, owner, true);
  const id = randomUUID();
  const draft: DraftInput = { brief: "", goal: "", deliverables: [], timing: null, constraints: [], assumptions: [], questions: [], items: [], depositCents: 0 };
  return transaction(ctx.db, () => {
    ctx.db.prepare("INSERT INTO engagements (id, owner_id, created_at) VALUES (?, ?, ?)").run(id, owner.ownerId, ctx.now());
    ctx.db.prepare("INSERT INTO drafts (engagement_id, version, draft_json) VALUES (?, 1, ?)").run(id, JSON.stringify(draft));
    return dto(ctx, owned(ctx, owner, id));
  });
}

export function listEngagements(ctx: HttpContext, owner: OwnerPrincipal): EngagementDto[] {
  assertPrincipal(ctx, owner);
  const rows = ctx.db.prepare(`SELECT e.*, d.version, d.draft_json FROM engagements e
    JOIN drafts d ON d.engagement_id = e.id WHERE e.owner_id = ? ORDER BY e.created_at DESC, e.id DESC`)
    .all(owner.ownerId) as unknown as EngagementRow[];
  return rows.map((row) => dto(ctx, row));
}

export function getEngagement(ctx: HttpContext, owner: OwnerPrincipal, id: string): EngagementDto {
  assertPrincipal(ctx, owner);
  return dto(ctx, owned(ctx, owner, id));
}

export function saveDraft(ctx: HttpContext, owner: OwnerPrincipal, id: string, input: { expectedVersion: number; draft: DraftInput }): EngagementDto {
  assertPrincipal(ctx, owner, true);
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION", "Invalid draft input.", 400);
  const { expectedVersion, draft } = parsed.data;
  total(draft);
  if (new Set(draft.questions.map((question) => question.id)).size !== draft.questions.length) {
    throw new AppError("VALIDATION", "Question identifiers must be unique.", 400);
  }
  return transaction(ctx.db, () => {
    const row = owned(ctx, owner, id);
    checkVersion(row, expectedVersion);
    const update = ctx.db.prepare("UPDATE drafts SET version = version + 1, draft_json = ? WHERE engagement_id = ? AND version = ?")
      .run(JSON.stringify(draft), id, expectedVersion);
    if (update.changes !== 1) throw new AppError("CONFLICT", "Draft changed. Reload and try again.", 409);
    ctx.db.prepare("UPDATE engagements SET active_quote_id = NULL WHERE id = ? AND owner_id = ?").run(id, owner.ownerId);
    retireUnused(ctx, id);
    return dto(ctx, owned(ctx, owner, id));
  });
}

export function approve(ctx: HttpContext, owner: OwnerPrincipal, id: string, input: { expectedVersion: number }): ApprovedQuote {
  assertPrincipal(ctx, owner, true);
  const parsed = approveSchema.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION", "Invalid approval input.", 400);
  return transaction(ctx.db, () => {
    const row = owned(ctx, owner, id);
    checkVersion(row, parsed.data.expectedVersion);
    if (row.active_quote_id) throw new AppError("CONFLICT", "Draft is already approved.", 409);
    const stored = draftSchema.safeParse(JSON.parse(row.draft_json));
    if (!stored.success) throw new AppError("VALIDATION", "Invalid draft input.", 400);
    const draft = stored.data;
    const totalCents = total(draft);
    if (!draft.goal.trim() || draft.deliverables.length === 0 || draft.deliverables.some((value) => !value.trim())
      || draft.items.length === 0 || draft.items.some((item) => !item.description.trim())
      || draft.questions.some((question) => !question.text.trim() || (question.blocking && !question.answer?.trim()))
      || totalCents <= 0 || draft.depositCents <= 0 || draft.depositCents > totalCents) {
      throw new AppError("VALIDATION", "Complete quote terms and resolve blocking questions before approval.", 400);
    }
    const revision = (ctx.db.prepare("SELECT COALESCE(MAX(revision), 0) AS revision FROM quotes WHERE engagement_id = ?").get(id)!.revision as number) + 1;
    if (!Number.isSafeInteger(revision)) throw new AppError("CONFLICT", "Quote revision limit reached.", 409);
    const quote: ApprovedQuote = {
      quoteId: randomUUID(), revision, goal: draft.goal, deliverables: draft.deliverables, timing: draft.timing,
      constraints: draft.constraints, assumptions: draft.assumptions, questions: draft.questions, items: draft.items,
      totalCents, depositCents: draft.depositCents, currency: "USD", approvedAt: ctx.now(),
    };
    ctx.db.prepare(`INSERT INTO quotes (id, engagement_id, revision, snapshot_json, total_cents, deposit_cents, currency, approved_by, approved_at)
      VALUES (?, ?, ?, ?, ?, ?, 'USD', ?, ?)`)
      .run(quote.quoteId, id, revision, JSON.stringify(quote), totalCents, quote.depositCents, owner.ownerId, quote.approvedAt);
    ctx.db.prepare("UPDATE engagements SET active_quote_id = ? WHERE id = ? AND owner_id = ?").run(quote.quoteId, id, owner.ownerId);
    return quote;
  });
}
