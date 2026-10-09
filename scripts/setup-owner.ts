import { randomBytes } from "node:crypto";
import { chmodSync, closeSync, existsSync, mkdirSync, openSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { provisionOwner } from "../src/server/auth";
import { getConfig, loadEnvironment } from "../src/server/config";
import { openDatabase } from "../src/server/db";
import { AppError } from "../src/server/errors";

async function main(): Promise<void> {
  loadEnvironment();
  const config = getConfig();
  if (config.databasePath === ":memory:") throw new AppError("CONFIG_REQUIRED", "Owner setup requires a persistent database.", 503);
  if (process.argv.length > 3) throw new AppError("VALIDATION", "Supply only an optional owner username.", 400);
  const username = process.argv[2] ?? "owner";
  const path = resolve(dirname(config.databasePath), "owner-access.json");
  if (existsSync(path)) throw new AppError("CONFLICT", "Private access file already exists.", 409);
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  // Reserve privately before provisioning; failures never leave credentials on disk.
  const file = openSync(path, "wx", 0o600);
  closeSync(file);
  let db: DatabaseSync | undefined;
  let complete = false;
  try {
    db = openDatabase(config.databasePath);
    const password = randomBytes(32).toString("base64url");
    writeFileSync(path, JSON.stringify({ username, password, appOrigin: config.appOrigin }, null, 2) + "\n", { mode: 0o600 });
    chmodSync(path, 0o600);
    await provisionOwner(db, username, password);
    complete = true;
    console.log("Owner provisioned. Credentials stored in private owner-access.json beside the database.");
  } finally {
    db?.close();
    if (!complete) unlinkSync(path);
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof AppError ? error.message : "Owner setup failed.");
  process.exitCode = 1;
});
