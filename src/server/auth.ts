import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import type { AuthResponse } from "../shared/contracts";
import type { BuyerPrincipal, HttpContext, OwnerPrincipal } from "./context";
import { transaction } from "./db";
import { AppError } from "./errors";

const SCRYPT = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 } as const;
const ANONYMOUS_TTL = 15 * 60 * 1000;
const OWNER_TTL = 8 * 60 * 60 * 1000;
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
const usernameSchema = z.string().min(3).max(64).regex(/^[A-Za-z0-9._-]+$/);
const loginSchema = z.strictObject({ username: usernameSchema, password: z.string().min(1).max(256) });
const ownerSchema = z.strictObject({ username: usernameSchema, password: z.string().min(12).max(256) });
const dummySalt = randomBytes(16);
const dummyHash = randomBytes(64);
let activeHashes = 0;

interface SessionRow { token_hash: string; csrf_hash: string; owner_id: string | null; expires_at: number; username: string | null }
interface OwnerRow { id: string; password_salt: string; password_hash: string; scrypt_params: string }
interface Bucket { count: number; until: number }
interface Throttles { accounts: Map<string, Bucket>; global: Bucket }
const throttles = new WeakMap<DatabaseSync, Throttles>();

function hash(value: string): string { return createHash("sha256").update(value).digest("hex"); }

function checkHost(ctx: HttpContext, mutation = false): void {
  const origin = new URL(ctx.config.appOrigin);
  const supplied = ctx.request.headers.get("origin");
  if (ctx.request.headers.get("host") !== origin.host || new URL(ctx.request.url).origin !== origin.origin
    || (mutation ? supplied !== origin.origin : supplied !== null && supplied !== origin.origin)) {
    throw new AppError("FORBIDDEN", "Request origin is not permitted.", 403);
  }
}

function cookies(ctx: HttpContext): Map<string, string> {
  const header = ctx.request.headers.get("cookie") ?? "";
  if (header.length > 8192) throw new AppError("UNAUTHENTICATED", "Authentication required.", 401);
  const result = new Map<string, string>();
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    const name = part.slice(0, index).trim();
    if (name !== "scope_session" && name !== "scope_csrf") continue;
    if (result.has(name)) throw new AppError("UNAUTHENTICATED", "Authentication required.", 401);
    result.set(name, part.slice(index + 1).trim());
  }
  return result;
}

function findSession(ctx: HttpContext, values = cookies(ctx)): SessionRow | undefined {
  const token = values.get("scope_session");
  if (!token || !TOKEN.test(token)) return undefined;
  return ctx.db.prepare(`SELECT s.*, o.username FROM sessions s LEFT JOIN owners o ON o.id = s.owner_id
    WHERE s.token_hash = ? AND s.expires_at > ?`).get(hash(token), ctx.now()) as unknown as SessionRow | undefined;
}

function sameHash(token: string | undefined, expected: string): boolean {
  if (!token || !TOKEN.test(token) || !/^[a-f0-9]{64}$/.test(expected)) return false;
  return timingSafeEqual(Buffer.from(hash(token), "hex"), Buffer.from(expected, "hex"));
}

function requireSessionMutation(ctx: HttpContext): SessionRow {
  checkHost(ctx, true);
  const values = cookies(ctx);
  const session = findSession(ctx, values);
  if (!session) throw new AppError("UNAUTHENTICATED", "Authentication required.", 401);
  const csrf = values.get("scope_csrf");
  if (!sameHash(csrf, session.csrf_hash) || ctx.request.headers.get("x-csrf-token") !== csrf) {
    throw new AppError("FORBIDDEN", "Request verification failed.", 403);
  }
  return session;
}

function setCookies(ctx: HttpContext, token: string, csrf: string, ttl: number): void {
  const attributes = `Path=/; SameSite=Strict; Max-Age=${Math.floor(ttl / 1000)}${ctx.config.appOrigin.startsWith("https:") ? "; Secure" : ""}`;
  ctx.responseHeaders.append("Set-Cookie", `scope_session=${token}; HttpOnly; ${attributes}`);
  ctx.responseHeaders.append("Set-Cookie", `scope_csrf=${csrf}; ${attributes}`);
}

function newSession(ctx: HttpContext, ownerId: string | null, username: string | null, previous?: string): AuthResponse {
  const token = randomBytes(32).toString("base64url");
  const csrf = randomBytes(32).toString("base64url");
  const ttl = ownerId ? OWNER_TTL : ANONYMOUS_TTL;
  transaction(ctx.db, () => {
    ctx.db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(ctx.now());
    if (previous) ctx.db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(previous);
    const count = ctx.db.prepare("SELECT COUNT(*) AS count FROM sessions").get()!.count as number;
    if (count >= 10000) throw new AppError("RATE_LIMITED", "Please try again later.", 429);
    ctx.db.prepare("INSERT INTO sessions (token_hash, owner_id, csrf_hash, expires_at) VALUES (?, ?, ?, ?)")
      .run(hash(token), ownerId, hash(csrf), ctx.now() + ttl);
  });
  setCookies(ctx, token, csrf, ttl);
  return { authenticated: ownerId !== null, username, csrfToken: csrf };
}

export function bootstrapCsrf(ctx: HttpContext): AuthResponse {
  checkHost(ctx);
  const values = cookies(ctx);
  const session = findSession(ctx, values);
  const csrf = values.get("scope_csrf");
  if (session && sameHash(csrf, session.csrf_hash)) {
    return { authenticated: session.owner_id !== null, username: session.username, csrfToken: csrf! };
  }
  return newSession(ctx, session?.owner_id ?? null, session?.username ?? null, session?.token_hash);
}

function takeLoginAttempt(ctx: HttpContext, username: string): { state: Throttles; account: string } {
  const now = ctx.now();
  let state = throttles.get(ctx.db);
  if (!state) {
    state = { accounts: new Map(), global: { count: 0, until: now + 60000 } };
    throttles.set(ctx.db, state);
  }
  for (const [key, bucket] of state.accounts) if (bucket.until <= now) state.accounts.delete(key);
  if (state.global.until <= now) state.global = { count: 0, until: now + 60000 };
  const account = hash(username);
  let bucket = state.accounts.get(account);
  if (state.global.count >= 30 || (bucket && bucket.count >= 5) || (!bucket && state.accounts.size >= 1000)) {
    throw new AppError("RATE_LIMITED", "Please try again later.", 429);
  }
  if (!bucket) {
    bucket = { count: 0, until: now + ANONYMOUS_TTL };
    state.accounts.set(account, bucket);
  }
  state.global.count++;
  bucket.count++;
  return { state, account };
}

async function derive(password: string, salt: Buffer): Promise<Buffer> {
  if (activeHashes >= 2) throw new AppError("RATE_LIMITED", "Please try again later.", 429);
  activeHashes++;
  try {
    return await new Promise<Buffer>((resolve, reject) => {
      scrypt(password, salt, 64, SCRYPT, (error, key) => error ? reject(error) : resolve(key));
    });
  } finally { activeHashes--; }
}

export async function login(ctx: HttpContext, input: { username: string; password: string }): Promise<AuthResponse> {
  const session = requireSessionMutation(ctx);
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION", "Invalid login input.", 400);
  const { username, password } = parsed.data;
  const { state, account } = takeLoginAttempt(ctx, username);
  const owner = ctx.db.prepare("SELECT id, password_salt, password_hash, scrypt_params FROM owners WHERE username = ?")
    .get(username) as unknown as OwnerRow | undefined;
  const validStored = owner && /^[a-f0-9]{32}$/.test(owner.password_salt) && /^[a-f0-9]{128}$/.test(owner.password_hash)
    && owner.scrypt_params === JSON.stringify(SCRYPT);
  const derived = await derive(password, validStored ? Buffer.from(owner.password_salt, "hex") : dummySalt);
  const matched = timingSafeEqual(derived, validStored ? Buffer.from(owner.password_hash, "hex") : dummyHash);
  if (!matched || !validStored || !owner) throw new AppError("UNAUTHENTICATED", "Invalid credentials.", 401);
  // Hashing yields. A logout or expiry during hashing must not resurrect a session.
  const current = requireSessionMutation(ctx);
  if (current.token_hash !== session.token_hash) throw new AppError("UNAUTHENTICATED", "Authentication required.", 401);
  const response = newSession(ctx, owner.id, username, session.token_hash);
  state.accounts.delete(account);
  return response;
}

export function logout(ctx: HttpContext): AuthResponse {
  const session = requireSessionMutation(ctx);
  if (!session.owner_id) throw new AppError("UNAUTHENTICATED", "Authentication required.", 401);
  ctx.db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(session.token_hash);
  setCookies(ctx, "", "", 0);
  return { authenticated: false, username: null, csrfToken: "" };
}

export function requireOwnerRead(ctx: HttpContext): OwnerPrincipal {
  checkHost(ctx);
  const session = findSession(ctx);
  if (!session?.owner_id) throw new AppError("UNAUTHENTICATED", "Authentication required.", 401);
  return { ownerId: session.owner_id };
}

export function requireOwnerMutation(ctx: HttpContext): OwnerPrincipal {
  const session = requireSessionMutation(ctx);
  if (!session.owner_id) throw new AppError("UNAUTHENTICATED", "Authentication required.", 401);
  return { ownerId: session.owner_id };
}

export function requireBuyerRead(ctx: HttpContext): BuyerPrincipal {
  checkHost(ctx);
  const token = ctx.request.headers.get("x-checkout-token");
  if (!token || !TOKEN.test(token)) throw new AppError("UNAUTHENTICATED", "Checkout access required.", 401);
  const row = ctx.db.prepare(`SELECT c.id AS capabilityId, c.attempt_id AS attemptId, c.quote_id AS quoteId
    FROM capabilities c JOIN attempts a ON a.id = c.attempt_id AND a.quote_id = c.quote_id
    JOIN quotes q ON q.id = c.quote_id AND q.engagement_id = a.engagement_id
    JOIN engagements e ON e.id = a.engagement_id
    WHERE c.token_hash = ? AND c.expires_at > ? AND c.revoked_at IS NULL
    AND (e.active_quote_id = c.quote_id OR a.order_id IS NOT NULL
      OR EXISTS (SELECT 1 FROM operations o WHERE o.attempt_id = a.id AND o.first_dispatched_at IS NOT NULL))`)
    .get(hash(token), ctx.now()) as unknown as BuyerPrincipal | undefined;
  if (!row) throw new AppError("UNAUTHENTICATED", "Checkout access required.", 401);
  return row;
}

export function requireBuyerMutation(ctx: HttpContext): BuyerPrincipal {
  requireSessionMutation(ctx);
  return requireBuyerRead(ctx);
}

export async function provisionOwner(db: DatabaseSync, username: string, password: string, now = Date.now()): Promise<{ ownerId: string }> {
  const parsed = ownerSchema.safeParse({ username, password });
  if (!parsed.success || !Number.isSafeInteger(now) || now < 0) throw new AppError("VALIDATION", "Invalid owner input.", 400);
  const salt = randomBytes(16);
  const key = await derive(parsed.data.password, salt);
  const ownerId = randomUUID();
  transaction(db, () => {
    if (db.prepare("SELECT id FROM owners WHERE username = ?").get(parsed.data.username)) {
      throw new AppError("CONFLICT", "Owner already exists.", 409);
    }
    db.prepare("INSERT INTO owners (id, username, password_salt, password_hash, scrypt_params, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(ownerId, parsed.data.username, salt.toString("hex"), key.toString("hex"), JSON.stringify(SCRYPT), now);
  });
  return { ownerId };
}
