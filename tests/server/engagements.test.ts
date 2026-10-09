import { createHash, randomBytes } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getConfig } from "../../src/server/config";
import type { HttpContext, OwnerPrincipal } from "../../src/server/context";
import { openDatabase } from "../../src/server/db";
import { approve, createEngagement, getEngagement, listEngagements, saveDraft } from "../../src/server/engagements";
import type { DraftInput } from "../../src/shared/contracts";

let db: DatabaseSync;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const owner = { ownerId: "owner-1" };
const other = { ownerId: "owner-2" };
let ctx: HttpContext;
let otherCtx: HttpContext;

function context(principal: OwnerPrincipal): HttpContext {
  const token = randomBytes(32).toString("base64url");
  const csrf = randomBytes(32).toString("base64url");
  db.prepare("INSERT INTO sessions VALUES (?, ?, ?, ?)").run(hash(token), principal.ownerId, hash(csrf), 1000000);
  return { request: new Request("http://127.0.0.1:3000/api/engagements", { method: "POST", headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000", cookie: `scope_session=${token}; scope_csrf=${csrf}`, "x-csrf-token": csrf } }), db, config: getConfig({ NODE_ENV: "test" }), now: () => 1000, responseHeaders: new Headers() };
}

function draft(overrides: Partial<DraftInput> = {}): DraftInput {
  return { brief: "Build a brochure site", goal: "Publish a brochure site", deliverables: ["3 pages"], timing: "2 weeks", constraints: [], assumptions: [], questions: [], items: [{ description: "Brochure site", quantity: 2, unitCents: 10000 }], depositCents: 5000, ...overrides };
}

beforeEach(() => {
  db = openDatabase(":memory:");
  db.exec("INSERT INTO owners VALUES ('owner-1', 'owner1', 'salt', 'hash', '{}', 1), ('owner-2', 'owner2', 'salt', 'hash', '{}', 1)");
  ctx = context(owner);
  otherCtx = context(other);
});
afterEach(() => db.close());

describe("owner-scoped versioned drafts", () => {
  it("creates empty drafts, saves incomplete drafts and lists only owned records", () => {
    const first = createEngagement(ctx, owner);
    const second = createEngagement(otherCtx, other);
    expect(first.draftVersion).toBe(1);
    expect(first.quote).toBeNull();
    expect(first.payment).toBeNull();
    const saved = saveDraft(ctx, owner, first.engagementId, { expectedVersion: 1, draft: draft({ goal: "", deliverables: [], items: [], depositCents: 0 }) });
    expect(saved.draftVersion).toBe(2);
    expect(listEngagements(ctx, owner).map((entry) => entry.engagementId)).toEqual([first.engagementId]);
    expect(listEngagements(otherCtx, other).map((entry) => entry.engagementId)).toEqual([second.engagementId]);
  });

  it("denies 10 cross-owner reads/mutations with zero writes or disclosures", () => {
    const engagement = createEngagement(ctx, owner);
    const before = db.prepare("SELECT * FROM drafts").get();
    const actions = [
      () => getEngagement(otherCtx, other, engagement.engagementId),
      () => saveDraft(otherCtx, other, engagement.engagementId, { expectedVersion: 1, draft: draft() }),
      () => approve(otherCtx, other, engagement.engagementId, { expectedVersion: 1 }),
      () => getEngagement(otherCtx, owner, engagement.engagementId),
      () => saveDraft(otherCtx, owner, engagement.engagementId, { expectedVersion: 1, draft: draft() }),
      () => approve(otherCtx, owner, engagement.engagementId, { expectedVersion: 1 }),
      () => createEngagement(otherCtx, owner),
      () => listEngagements(otherCtx, owner),
      () => getEngagement(ctx, other, engagement.engagementId),
      () => saveDraft(ctx, other, engagement.engagementId, { expectedVersion: 1, draft: draft() }),
    ];
    for (const action of actions) expect(action).toThrow();
    expect(db.prepare("SELECT * FROM drafts").get()).toEqual(before);
    expect(db.prepare("SELECT COUNT(*) AS count FROM quotes").get()).toEqual({ count: 0 });
  });

  it("rejects stale and malformed versions with zero lost updates", () => {
    const engagement = createEngagement(ctx, owner);
    saveDraft(ctx, owner, engagement.engagementId, { expectedVersion: 1, draft: draft() });
    expect(() => saveDraft(ctx, owner, engagement.engagementId, { expectedVersion: 1, draft: draft({ goal: "Lost update" }) })).toThrow();
    expect(() => approve(ctx, owner, engagement.engagementId, { expectedVersion: 1 })).toThrow();
    for (const version of [0, -1, 1.5, NaN, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => saveDraft(ctx, owner, engagement.engagementId, { expectedVersion: version, draft: draft() })).toThrow();
    }
    expect(getEngagement(ctx, owner, engagement.engagementId).draft.goal).toBe("Publish a brochure site");
  });

  it("rejects 13 malformed money/text inputs and unknown fields", () => {
    const engagement = createEngagement(ctx, owner);
    const invalid = [
      draft({ brief: "x".repeat(12001) }), draft({ goal: "x".repeat(2001) }),
      draft({ items: Array.from({ length: 101 }, () => ({ description: "a", quantity: 1, unitCents: 1 })) }),
      ...[0, 1001, 1.5].map((quantity) => draft({ items: [{ description: "a", quantity, unitCents: 1 }] })),
      ...[-1, 100000001, 1.1, NaN].map((unitCents) => draft({ items: [{ description: "a", quantity: 1, unitCents }] })),
      draft({ depositCents: 1.1 }), draft({ depositCents: -1 }),
      { ...draft(), approved: true },
    ];
    for (const input of invalid) expect(() => saveDraft(ctx, owner, engagement.engagementId, { expectedVersion: 1, draft: input })).toThrow();
    expect(getEngagement(ctx, owner, engagement.engagementId).draftVersion).toBe(1);
    expect(() => saveDraft(ctx, owner, engagement.engagementId, { expectedVersion: 1, draft: draft({ questions: [{ id: "q", text: "Question", blocking: true, answer: null }, { id: "q", text: "Question", blocking: false, answer: null }] }) })).toThrow();
    expect(() => saveDraft(ctx, owner, engagement.engagementId, { expectedVersion: 1, draft: draft(), surprise: true } as never)).toThrow();
  });
});

describe("explicit immutable commercial approval", () => {
  it("rejects 10 incomplete/review-required approvals, creates zero snapshots", () => {
    const invalid = [
      draft({ goal: "" }), draft({ goal: "  " }), draft({ deliverables: [] }), draft({ deliverables: [""] }),
      draft({ items: [] }), draft({ items: [{ description: "", quantity: 1, unitCents: 100 }] }),
      draft({ depositCents: 0 }), draft({ depositCents: 20001 }),
      draft({ questions: [{ id: "q", text: "What content?", blocking: true, answer: null }] }),
      draft({ questions: [{ id: "q", text: "What content?", blocking: true, answer: "  " }] }),
    ];
    for (const input of invalid) {
      const engagement = createEngagement(ctx, owner);
      const saved = saveDraft(ctx, owner, engagement.engagementId, { expectedVersion: 1, draft: input });
      expect(() => approve(ctx, owner, engagement.engagementId, { expectedVersion: saved.draftVersion })).toThrow();
    }
    expect(db.prepare("SELECT COUNT(*) AS count FROM quotes").get()).toEqual({ count: 0 });
  });

  it("computes exact USD total/deposit, records server authority, preserves historical revisions", () => {
    const engagement = createEngagement(ctx, owner);
    const saved = saveDraft(ctx, owner, engagement.engagementId, { expectedVersion: 1, draft: draft({ questions: [{ id: "q", text: "Content?", blocking: true, answer: "Provided" }] }) });
    const quote = approve(ctx, owner, engagement.engagementId, { expectedVersion: saved.draftVersion });
    expect(quote).toMatchObject({ revision: 1, totalCents: 20000, depositCents: 5000, currency: "USD", approvedAt: 1000 });
    expect(db.prepare("SELECT approved_by FROM quotes").get()).toEqual({ approved_by: owner.ownerId });
    expect(() => approve(ctx, owner, engagement.engagementId, { expectedVersion: saved.draftVersion })).toThrow();
    const edited = saveDraft(ctx, owner, engagement.engagementId, { expectedVersion: saved.draftVersion, draft: draft({ depositCents: 7500 }) });
    expect(edited.quote).toBeNull();
    const next = approve(ctx, owner, engagement.engagementId, { expectedVersion: edited.draftVersion });
    expect(next.revision).toBe(2);
    expect(next.quoteId).not.toBe(quote.quoteId);
    expect(JSON.parse(db.prepare("SELECT snapshot_json FROM quotes WHERE id = ?").get(quote.quoteId)!.snapshot_json as string)).toEqual(quote);
  });

  it("rejects 10 direct frozen revision mutations, leaves original snapshot intact", () => {
    const engagement = createEngagement(ctx, owner);
    const saved = saveDraft(ctx, owner, engagement.engagementId, { expectedVersion: 1, draft: draft() });
    const quote = approve(ctx, owner, engagement.engagementId, { expectedVersion: saved.draftVersion });
    const original = db.prepare("SELECT * FROM quotes WHERE id = ?").get(quote.quoteId);
    const changes = ["total_cents = 30000", "deposit_cents = 1000", "currency = 'EUR'", "snapshot_json = '{}'", "revision = 2", "approved_at = 2000", "approved_by = 'owner-2'", "id = 'new-id'", "engagement_id = 'unknown'"];
    for (const change of changes) expect(() => db.prepare(`UPDATE quotes SET ${change} WHERE id = ?`).run(quote.quoteId)).toThrow();
    expect(() => db.prepare("DELETE FROM quotes WHERE id = ?").run(quote.quoteId)).toThrow();
    expect(db.prepare("SELECT * FROM quotes WHERE id = ?").get(quote.quoteId)).toEqual(original);
  });

  it("accepts maximum exact total 100000000000 cents and rejects aggregate overflow", () => {
    const engagement = createEngagement(ctx, owner);
    const maximum = draft({ items: [{ description: "Maximum", quantity: 1000, unitCents: 100000000 }], depositCents: 100000000000 });
    const saved = saveDraft(ctx, owner, engagement.engagementId, { expectedVersion: 1, draft: maximum });
    expect(approve(ctx, owner, engagement.engagementId, { expectedVersion: saved.draftVersion }).totalCents).toBe(100000000000);
    expect(() => saveDraft(ctx, owner, engagement.engagementId, { expectedVersion: saved.draftVersion, draft: { ...maximum, items: [...maximum.items, { description: "Overflow", quantity: 1, unitCents: 1 }] } })).toThrow();
  });

  it("revokes unused capabilities and releases only undispatched reserved guard on edit", () => {
    const engagement = createEngagement(ctx, owner);
    const saved = saveDraft(ctx, owner, engagement.engagementId, { expectedVersion: 1, draft: draft() });
    const quote = approve(ctx, owner, engagement.engagementId, { expectedVersion: saved.draftVersion });
    db.prepare("INSERT INTO attempts (id, engagement_id, quote_id, merchant_id, deposit_cents, currency, state, guard_held, created_at) VALUES ('reserved', ?, ?, 'merchant', 5000, 'USD', 'reserved', 1, 1000)").run(engagement.engagementId, quote.quoteId);
    db.prepare("INSERT INTO capabilities VALUES ('unused', 'hash', 'reserved', ?, 100000, NULL)").run(quote.quoteId);
    db.exec("INSERT INTO operations (attempt_id, kind, request_id, status) VALUES ('reserved', 'create', 'key', 'ready')");
    saveDraft(ctx, owner, engagement.engagementId, { expectedVersion: saved.draftVersion, draft: draft({ depositCents: 6000 }) });
    expect(db.prepare("SELECT revoked_at FROM capabilities").get()).toEqual({ revoked_at: 1000 });
    expect(db.prepare("SELECT state, guard_held FROM attempts").get()).toEqual({ state: "terminal_unpaid", guard_held: 0 });
  });

  it("editing a draft preserves dispatched attempt and existing capability evidence bindings", () => {
    const engagement = createEngagement(ctx, owner);
    const saved = saveDraft(ctx, owner, engagement.engagementId, { expectedVersion: 1, draft: draft() });
    const quote = approve(ctx, owner, engagement.engagementId, { expectedVersion: saved.draftVersion });
    db.prepare("INSERT INTO attempts (id, engagement_id, quote_id, merchant_id, deposit_cents, currency, order_id, state, guard_held, created_at) VALUES ('dispatched', ?, ?, 'merchant', 5000, 'USD', 'order', 'uncertain', 1, 1000)").run(engagement.engagementId, quote.quoteId);
    db.prepare("INSERT INTO capabilities VALUES ('used', 'hash', 'dispatched', ?, 100000, NULL)").run(quote.quoteId);
    db.exec("INSERT INTO operations (attempt_id, kind, request_id, first_dispatched_at, retry_until, status) VALUES ('dispatched', 'create', 'key', 1000, 21601000, 'uncertain')");
    const original = db.prepare("SELECT * FROM attempts").get();
    saveDraft(ctx, owner, engagement.engagementId, { expectedVersion: saved.draftVersion, draft: draft({ depositCents: 6000 }) });
    expect(db.prepare("SELECT * FROM attempts").get()).toEqual(original);
    expect(db.prepare("SELECT revoked_at FROM capabilities").get()).toEqual({ revoked_at: null });
  });
});
