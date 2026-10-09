import { chmodSync, closeSync, mkdirSync, openSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Config } from "./context";

const globalState = globalThis as typeof globalThis & { scopeDatabases?: Map<string, DatabaseSync> };
const databases = globalState.scopeDatabases ??= new Map<string, DatabaseSync>();

export function openDatabase(path: string): DatabaseSync {
  const file = path === ":memory:" ? path : resolve(path);
  if (file !== ":memory:") {
    mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
    closeSync(openSync(file, "a", 0o600));
    chmodSync(file, 0o600);
  }
  const db = new DatabaseSync(file);
  try {
    db.exec("PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;");
    db.exec(readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

export function getDatabase(config: Config): DatabaseSync {
  const path = config.databasePath === ":memory:" ? config.databasePath : resolve(config.databasePath);
  const existing = databases.get(path);
  if (existing?.isOpen) return existing;
  const db = openDatabase(path);
  databases.set(path, db);
  return db;
}

export function transaction<T>(db: DatabaseSync, fn: () => T): T {
  if (db.isTransaction) throw new Error("Nested transactions are not supported.");
  if (["AsyncFunction", "AsyncGeneratorFunction", "GeneratorFunction"].includes(fn.constructor.name)) {
    throw new Error("Transactions require synchronous callbacks.");
  }
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    if (result !== null && (typeof result === "object" || typeof result === "function") && "then" in result) {
      if (result instanceof Promise) void result.catch(() => {});
      throw new Error("Transactions require synchronous callbacks.");
    }
    db.exec("COMMIT");
    return result;
  } catch (error) {
    if (db.isTransaction) db.exec("ROLLBACK");
    throw error;
  }
}
