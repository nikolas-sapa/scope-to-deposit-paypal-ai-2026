import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { getConfig } from "../../src/server/config";
import { getDatabase, openDatabase, transaction } from "../../src/server/db";

describe("real SQLite connection and transaction boundaries", () => {
  it("persists one committed record across close/reopen with private files", () => {
    const directory = mkdtempSync(join(tmpdir(), "scope-db-"));
    const path = join(directory, "private", "scope.sqlite");
    let db = openDatabase(path);
    try {
      transaction(db, () => db.prepare("INSERT INTO owners VALUES (?, ?, ?, ?, ?, ?)").run("o", "owner", "salt", "hash", "{}", 1));
      expect(statSync(path).mode & 0o777).toBe(0o600);
      expect(statSync(join(directory, "private")).mode & 0o777).toBe(0o700);
      db.close();
      db = openDatabase(path);
      expect(db.prepare("SELECT username FROM owners").get()).toEqual({ username: "owner" });
      expect(db.prepare("PRAGMA foreign_keys").get()).toEqual({ foreign_keys: 1 });
      expect(db.prepare("PRAGMA recursive_triggers").get()).toEqual({ recursive_triggers: 1 });
    } finally {
      db.close();
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("rolls back failed writes and 3 async callback forms, leaving zero rows", () => {
    const db = openDatabase(":memory:");
    try {
      db.exec("CREATE TABLE test_values (id INTEGER)");
      expect(() => transaction(db, () => { db.exec("INSERT INTO test_values VALUES (1)"); throw new Error("failure"); })).toThrow("failure");
      expect(() => transaction(db, () => Promise.resolve())).toThrow(/synchronous/);
      expect(() => transaction(db, async () => { db.exec("INSERT INTO test_values VALUES (2)"); })).toThrow(/synchronous/);
      expect(() => transaction(db, () => { db.exec("INSERT INTO test_values VALUES (3)"); return { then() {} }; })).toThrow(/synchronous/);
      expect(db.prepare("SELECT COUNT(*) AS count FROM test_values").get()).toEqual({ count: 0 });
      transaction(db, () => db.exec("INSERT INTO test_values VALUES (4)"));
      expect(db.prepare("SELECT COUNT(*) AS count FROM test_values").get()).toEqual({ count: 1 });
    } finally { db.close(); }
  });

  it("rejects nested transactions without rolling back caller-owned transaction", () => {
    const db = openDatabase(":memory:");
    try {
      transaction(db, () => {
        expect(() => transaction(db, () => 1)).toThrow(/nested/i);
        expect(db.isTransaction).toBe(true);
      });
      expect(db.isTransaction).toBe(false);
    } finally { db.close(); }
  });

  it("caches an open database but replaces a closed connection", () => {
    const config = { ...getConfig({ NODE_ENV: "test" }), databasePath: ":memory:" };
    const first = getDatabase(config);
    expect(getDatabase(config)).toBe(first);
    first.close();
    const second = getDatabase(config);
    expect(second === first).toBe(false);
    second.close();
  });

  it("preserves one connection across module reloads and equivalent resolved paths", async () => {
    const directory = mkdtempSync(join(tmpdir(), "scope-db-reload-"));
    const config = { ...getConfig({ NODE_ENV: "test" }), databasePath: join(directory, "scope.sqlite") };
    const first = getDatabase(config);
    const connections = new Set([first]);
    try {
      first.exec("CREATE TABLE reload_probe (value INTEGER); INSERT INTO reload_probe VALUES (1)");
      vi.resetModules();
      const reloaded = await import("../../src/server/db");
      const second = reloaded.getDatabase({ ...config, databasePath: `${directory}/unused/../scope.sqlite` });
      connections.add(second);
      expect(second === first).toBe(true);
      expect(second.prepare("SELECT value FROM reload_probe").get()).toEqual({ value: 1 });
      second.exec("INSERT INTO reload_probe VALUES (2)");
      expect(first.prepare("SELECT COUNT(*) AS count FROM reload_probe").get()).toEqual({ count: 2 });
    } finally {
      for (const connection of connections) if (connection.isOpen) connection.close();
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

describe("configuration boundary", () => {
  it("keeps authentication/drafts available with zero provider credentials", () => {
    const config = getConfig({ NODE_ENV: "test" });
    expect(config.appOrigin).toBe("http://127.0.0.1:3000");
    expect(config.paypalClientSecret).toBe("");
    expect(config.aiUsageEnabled).toBe(false);
  });

  it("accepts HTTPS and explicit HTTP loopback only, rejects 9 unsafe origins", () => {
    expect(getConfig({ NODE_ENV: "test", APP_ORIGIN: "https://scope.example" }).appOrigin).toBe("https://scope.example");
    expect(getConfig({ NODE_ENV: "test", APP_ORIGIN: "http://localhost:3000" }).appOrigin).toBe("http://localhost:3000");
    for (const origin of ["http://scope.example", "https://user:password@scope.example", "https://scope.example/path", "https://scope.example?query=1", "https://scope.example#secret", "ftp://localhost", "null", "https://scope.example/", "http://127.0.0.2:3000"]) {
      expect(() => getConfig({ NODE_ENV: "test", APP_ORIGIN: origin })).toThrow();
    }
    expect(() => getConfig({ NODE_ENV: "test", AI_USAGE_ENABLED: "yes" })).toThrow();
  });
});

describe("real owner provisioning CLI", () => {
  it("creates private 0600 credentials, prints zero passwords, rejects overwrite", () => {
    const directory = mkdtempSync(join(tmpdir(), "scope-owner-"));
    const path = join(directory, "private", "scope.sqlite");
    const accessPath = join(directory, "private", "owner-access.json");
    const args = ["node_modules/tsx/dist/cli.mjs", "scripts/setup-owner.ts", "judge"];
    const options = { encoding: "utf8" as const, env: { ...process.env, APP_ORIGIN: "http://127.0.0.1:3000", DATABASE_PATH: path } };
    try {
      const first = spawnSync(process.execPath, args, options);
      expect(first.status).toBe(0);
      const access = JSON.parse(readFileSync(accessPath, "utf8")) as { username: string; password: string };
      expect(access.username).toBe("judge");
      expect(Buffer.from(access.password, "base64url")).toHaveLength(32);
      expect(first.stdout + first.stderr).not.toContain(access.password);
      expect(statSync(accessPath).mode & 0o777).toBe(0o600);
      const db = openDatabase(path);
      expect(db.prepare("SELECT COUNT(*) AS count FROM owners").get()).toEqual({ count: 1 });
      expect(JSON.stringify(db.prepare("SELECT * FROM owners").get())).not.toContain(access.password);
      db.close();
      const second = spawnSync(process.execPath, args, options);
      expect(second.status).toBe(1);
      expect(second.stdout + second.stderr).not.toContain(access.password);
      expect(JSON.parse(readFileSync(accessPath, "utf8"))).toEqual(access);
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });

  it("removes reserved access file after invalid input, leaves zero owners", () => {
    const directory = mkdtempSync(join(tmpdir(), "scope-invalid-owner-"));
    const path = join(directory, "scope.sqlite");
    try {
      const result = spawnSync(process.execPath, ["node_modules/tsx/dist/cli.mjs", "scripts/setup-owner.ts", "invalid username"], { encoding: "utf8", env: { ...process.env, DATABASE_PATH: path, APP_ORIGIN: "http://127.0.0.1:3000" } });
      expect(result.status).toBe(1);
      expect(existsSync(join(directory, "owner-access.json"))).toBe(false);
      const db = openDatabase(path);
      expect(db.prepare("SELECT COUNT(*) AS count FROM owners").get()).toEqual({ count: 0 });
      db.close();
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
});
