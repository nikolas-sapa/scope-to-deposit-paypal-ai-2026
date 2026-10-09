PRAGMA foreign_keys = ON;
PRAGMA recursive_triggers = ON;
CREATE TABLE IF NOT EXISTS owners (
  id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE,
  password_salt TEXT NOT NULL, password_hash TEXT NOT NULL, scrypt_params TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, owner_id TEXT REFERENCES owners(id),
  csrf_hash TEXT NOT NULL, expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS engagements (
  id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES owners(id),
  active_quote_id TEXT, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS drafts (
  engagement_id TEXT PRIMARY KEY REFERENCES engagements(id), version INTEGER NOT NULL,
  draft_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY, engagement_id TEXT NOT NULL REFERENCES engagements(id), revision INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL, total_cents INTEGER NOT NULL CHECK(typeof(total_cents) = 'integer' AND total_cents > 0 AND total_cents <= 100000000000),
  deposit_cents INTEGER NOT NULL CHECK(typeof(deposit_cents) = 'integer' AND deposit_cents > 0 AND deposit_cents <= total_cents),
  currency TEXT NOT NULL CHECK(currency = 'USD'), approved_by TEXT NOT NULL REFERENCES owners(id), approved_at INTEGER NOT NULL,
  UNIQUE(engagement_id, revision)
);
CREATE TABLE IF NOT EXISTS attempts (
  id TEXT PRIMARY KEY, engagement_id TEXT NOT NULL REFERENCES engagements(id), quote_id TEXT NOT NULL REFERENCES quotes(id),
  merchant_id TEXT NOT NULL, deposit_cents INTEGER NOT NULL CHECK(typeof(deposit_cents) = 'integer' AND deposit_cents > 0), currency TEXT NOT NULL CHECK(currency = 'USD'),
  order_id TEXT UNIQUE, state TEXT NOT NULL CHECK(state IN ('reserved','creating','awaiting_buyer','capturing','pending','uncertain','paid','terminal_unpaid')),
  guard_held INTEGER NOT NULL CHECK(guard_held IN (0,1)), cancel_observed_at INTEGER, version INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS one_guard_per_engagement ON attempts(engagement_id) WHERE guard_held = 1;
CREATE TABLE IF NOT EXISTS operations (
  attempt_id TEXT NOT NULL REFERENCES attempts(id), kind TEXT NOT NULL CHECK(kind IN ('create','capture')),
  request_id TEXT NOT NULL UNIQUE, payload_json TEXT, payload_hash TEXT,
  first_dispatched_at INTEGER, retry_until INTEGER,
  status TEXT NOT NULL CHECK(status IN ('ready','dispatched','uncertain','completed','failed')),
  lease_until INTEGER, PRIMARY KEY(attempt_id, kind)
);
CREATE TABLE IF NOT EXISTS capabilities (
  id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE,
  attempt_id TEXT NOT NULL REFERENCES attempts(id), quote_id TEXT NOT NULL REFERENCES quotes(id),
  expires_at INTEGER NOT NULL, revoked_at INTEGER
);
CREATE TABLE IF NOT EXISTS paid_deposits (
  engagement_id TEXT PRIMARY KEY REFERENCES engagements(id), attempt_id TEXT NOT NULL UNIQUE REFERENCES attempts(id),
  capture_id TEXT NOT NULL UNIQUE, order_id TEXT NOT NULL, merchant_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK(typeof(amount_cents) = 'integer' AND amount_cents > 0), currency TEXT NOT NULL CHECK(currency = 'USD'),
  verified_at INTEGER NOT NULL, provenance TEXT NOT NULL CHECK(provenance IN ('REAL_SANDBOX','LOCAL_FIXTURE')),
  evidence_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS webhook_receipts (
  event_id TEXT PRIMARY KEY, raw_body TEXT NOT NULL, body_hash TEXT NOT NULL, event_type TEXT NOT NULL,
  received_at INTEGER NOT NULL, processed_at INTEGER, disposition TEXT NOT NULL
);
CREATE TRIGGER IF NOT EXISTS immutable_quote_update BEFORE UPDATE ON quotes BEGIN
  SELECT RAISE(ABORT, 'approved quote is immutable');
END;
CREATE TRIGGER IF NOT EXISTS immutable_quote_delete BEFORE DELETE ON quotes BEGIN
  SELECT RAISE(ABORT, 'approved quote is immutable');
END;
CREATE TRIGGER IF NOT EXISTS immutable_attempt_binding BEFORE UPDATE ON attempts
WHEN NEW.id IS NOT OLD.id OR NEW.engagement_id IS NOT OLD.engagement_id OR NEW.quote_id IS NOT OLD.quote_id
  OR NEW.merchant_id IS NOT OLD.merchant_id OR NEW.deposit_cents IS NOT OLD.deposit_cents OR NEW.currency IS NOT OLD.currency
  OR (OLD.order_id IS NOT NULL AND NEW.order_id IS NOT OLD.order_id)
  OR (OLD.state = 'paid' AND (NEW.state != 'paid' OR NEW.guard_held != 1))
BEGIN SELECT RAISE(ABORT, 'payment binding is immutable'); END;
CREATE TRIGGER IF NOT EXISTS immutable_operation BEFORE UPDATE ON operations
WHEN NEW.attempt_id IS NOT OLD.attempt_id OR NEW.kind IS NOT OLD.kind OR NEW.request_id IS NOT OLD.request_id
  OR (OLD.payload_json IS NOT NULL AND (NEW.payload_json IS NOT OLD.payload_json OR NEW.payload_hash IS NOT OLD.payload_hash))
  OR (OLD.first_dispatched_at IS NOT NULL AND (NEW.first_dispatched_at IS NOT OLD.first_dispatched_at OR NEW.retry_until IS NOT OLD.retry_until))
BEGIN SELECT RAISE(ABORT, 'operation identity is immutable'); END;
CREATE TRIGGER IF NOT EXISTS immutable_operation_delete BEFORE DELETE ON operations BEGIN
  SELECT RAISE(ABORT, 'operation identity is immutable');
END;
CREATE TRIGGER IF NOT EXISTS immutable_paid_update BEFORE UPDATE ON paid_deposits BEGIN
  SELECT RAISE(ABORT, 'verified deposit is immutable');
END;
CREATE TRIGGER IF NOT EXISTS immutable_paid_delete BEFORE DELETE ON paid_deposits BEGIN
  SELECT RAISE(ABORT, 'verified deposit is immutable');
END;
