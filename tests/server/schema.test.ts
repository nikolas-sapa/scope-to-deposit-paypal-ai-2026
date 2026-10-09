import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const schema = readFileSync(new URL("../../src/server/schema.sql", import.meta.url), "utf8");
let db: DatabaseSync;

function insertQuote(totalCents = 10000, depositCents = 2500) {
  db.prepare(`INSERT INTO quotes
    (id, engagement_id, revision, snapshot_json, total_cents, deposit_cents, currency, approved_by, approved_at)
    VALUES ('quote-1', 'engagement-1', 1, '{"approved":true}', ?, ?, 'USD', 'owner-1', 1000)`)
    .run(totalCents, depositCents);
}

function insertAttempt(depositCents = 2500) {
  db.prepare(`INSERT INTO attempts
    (id, engagement_id, quote_id, merchant_id, deposit_cents, currency, order_id, state, guard_held, created_at)
    VALUES ('attempt-1', 'engagement-1', 'quote-1', 'merchant-1', ?, 'USD', 'order-1', 'capturing', 1, 1000)`)
    .run(depositCents);
}

function insertPaid(amountCents = 2500) {
  db.prepare(`INSERT INTO paid_deposits
    (engagement_id, attempt_id, capture_id, order_id, merchant_id, amount_cents, currency, verified_at, provenance, evidence_json)
    VALUES ('engagement-1', 'attempt-1', 'capture-1', 'order-1', 'merchant-1', ?, 'USD', 1000, 'LOCAL_FIXTURE', '{}')`)
    .run(amountCents);
}

function insertDispatchedOperation() {
  db.exec(`INSERT INTO operations
    (attempt_id, kind, request_id, payload_json, payload_hash, first_dispatched_at, retry_until, status)
    VALUES ('attempt-1', 'capture', 'stable-request-1', '{"order":"order-1"}', 'payload-hash-1', 1000, 21601000, 'dispatched')`);
}

describe("SQLite schema invariants", () => {
  beforeEach(() => {
    db = new DatabaseSync(":memory:");
    db.exec(schema);
    db.exec(`INSERT INTO owners (id, username, password_salt, password_hash, scrypt_params, created_at)
      VALUES ('owner-1', 'owner', 'fixture-salt', 'fixture-hash', '{}', 1000);
      INSERT INTO engagements (id, owner_id, created_at) VALUES ('engagement-1', 'owner-1', 1000)`);
  });

  afterEach(() => db.close());

  it("enables recursive triggers on every initialized connection", () => {
    expect(db.prepare("PRAGMA recursive_triggers").get()).toEqual({ recursive_triggers: 1 });
  });

  it("accepts valid integer cents in all four monetary columns", () => {
    insertQuote();
    insertAttempt();
    insertPaid();
    expect(db.prepare("SELECT total_cents, deposit_cents FROM quotes").get())
      .toEqual({ total_cents: 10000, deposit_cents: 2500 });
    expect(db.prepare("SELECT deposit_cents FROM attempts").get()).toEqual({ deposit_cents: 2500 });
    expect(db.prepare("SELECT amount_cents FROM paid_deposits").get()).toEqual({ amount_cents: 2500 });
  });

  it("blocks primary-key quote replacement and preserves approved terms", () => {
    insertQuote();
    const original = db.prepare("SELECT * FROM quotes").get();
    expect(() => db.exec(`INSERT OR REPLACE INTO quotes
      (id, engagement_id, revision, snapshot_json, total_cents, deposit_cents, currency, approved_by, approved_at)
      VALUES ('quote-1', 'engagement-1', 1, '{}', 20000, 5000, 'USD', 'owner-1', 2000)`))
      .toThrow("approved quote is immutable");
    expect(db.prepare("SELECT * FROM quotes").get()).toEqual(original);
    expect(db.prepare("SELECT COUNT(*) AS count FROM quotes").get()).toEqual({ count: 1 });
  });

  it("blocks revision-conflict quote replacement with a different ID", () => {
    insertQuote();
    const original = db.prepare("SELECT * FROM quotes").get();
    expect(() => db.exec(`INSERT OR REPLACE INTO quotes
      (id, engagement_id, revision, snapshot_json, total_cents, deposit_cents, currency, approved_by, approved_at)
      VALUES ('quote-2', 'engagement-1', 1, '{}', 20000, 5000, 'USD', 'owner-1', 2000)`))
      .toThrow("approved quote is immutable");
    expect(db.prepare("SELECT * FROM quotes").get()).toEqual(original);
    expect(db.prepare("SELECT COUNT(*) AS count FROM quotes").get()).toEqual({ count: 1 });
  });

  it("blocks paid-deposit replacement and preserves verified evidence", () => {
    insertQuote();
    insertAttempt();
    insertPaid();
    const original = db.prepare("SELECT * FROM paid_deposits").get();
    expect(() => db.exec(`INSERT OR REPLACE INTO paid_deposits
      (engagement_id, attempt_id, capture_id, order_id, merchant_id, amount_cents, currency, verified_at, provenance, evidence_json)
      VALUES ('engagement-1', 'attempt-1', 'capture-2', 'order-1', 'merchant-1', 5000, 'USD', 2000, 'LOCAL_FIXTURE', '{"changed":true}')`))
      .toThrow("verified deposit is immutable");
    expect(db.prepare("SELECT * FROM paid_deposits").get()).toEqual(original);
    expect(db.prepare("SELECT COUNT(*) AS count FROM paid_deposits").get()).toEqual({ count: 1 });
  });

  it("blocks deleting and reinserting a dispatched operation with a new key", () => {
    insertQuote();
    insertAttempt();
    insertDispatchedOperation();
    const original = db.prepare("SELECT * FROM operations").get();
    expect(() => db.exec(`DELETE FROM operations WHERE attempt_id = 'attempt-1' AND kind = 'capture';
      INSERT INTO operations (attempt_id, kind, request_id, status)
      VALUES ('attempt-1', 'capture', 'replacement-request-2', 'ready')`))
      .toThrow("operation identity is immutable");
    expect(db.prepare("SELECT * FROM operations").get()).toEqual(original);
    expect(db.prepare("SELECT COUNT(*) AS count FROM operations").get()).toEqual({ count: 1 });
  });

  it("blocks dispatched operation replacement and preserves original key and payload", () => {
    insertQuote();
    insertAttempt();
    insertDispatchedOperation();
    const original = db.prepare("SELECT * FROM operations").get();
    expect(() => db.exec(`INSERT OR REPLACE INTO operations (attempt_id, kind, request_id, status)
      VALUES ('attempt-1', 'capture', 'replacement-request-2', 'ready')`))
      .toThrow("operation identity is immutable");
    expect(db.prepare("SELECT * FROM operations").get()).toEqual(original);
    expect(db.prepare("SELECT COUNT(*) AS count FROM operations").get()).toEqual({ count: 1 });
  });

  it("blocks deletion of an undispatched operation identity", () => {
    insertQuote();
    insertAttempt();
    db.exec(`INSERT INTO operations (attempt_id, kind, request_id, status)
      VALUES ('attempt-1', 'create', 'stable-create-request', 'ready')`);
    expect(() => db.exec("DELETE FROM operations")).toThrow("operation identity is immutable");
    expect(db.prepare("SELECT request_id FROM operations").get()).toEqual({ request_id: "stable-create-request" });
  });

  it("rejects fractional quote total cents", () => {
    expect(() => insertQuote(10000.5)).toThrow(/CHECK constraint failed/);
    expect(db.prepare("SELECT COUNT(*) AS count FROM quotes").get()).toEqual({ count: 0 });
  });

  it("rejects fractional quote deposit cents", () => {
    expect(() => insertQuote(10000, 2500.5)).toThrow(/CHECK constraint failed/);
    expect(db.prepare("SELECT COUNT(*) AS count FROM quotes").get()).toEqual({ count: 0 });
  });

  it("rejects fractional attempt deposit cents", () => {
    insertQuote();
    expect(() => insertAttempt(2500.5)).toThrow(/CHECK constraint failed/);
    expect(db.prepare("SELECT COUNT(*) AS count FROM attempts").get()).toEqual({ count: 0 });
  });

  it("rejects fractional paid gross amount cents", () => {
    insertQuote();
    insertAttempt();
    expect(() => insertPaid(2500.5)).toThrow(/CHECK constraint failed/);
    expect(db.prepare("SELECT COUNT(*) AS count FROM paid_deposits").get()).toEqual({ count: 0 });
  });
});
