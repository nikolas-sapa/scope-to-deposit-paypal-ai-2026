import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";
import type { Config } from "./context";
import { AppError } from "./errors";

export const PAYPAL_SANDBOX_ORIGIN = "https://api-m.sandbox.paypal.com";

export function loadEnvironment(): void {
  const path = resolve(".env.local");
  if (existsSync(path)) loadEnvFile(path);
}

export function getConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const appOrigin = env.APP_ORIGIN ?? "http://127.0.0.1:3000";
  let origin: URL;
  try { origin = new URL(appOrigin); }
  catch { throw new AppError("CONFIG_REQUIRED", "Invalid application configuration.", 503); }
  const loopback = ["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname);
  if (origin.origin !== appOrigin || origin.username || origin.password
    || (origin.protocol !== "https:" && !(origin.protocol === "http:" && loopback))) {
    throw new AppError("CONFIG_REQUIRED", "Invalid application configuration.", 503);
  }
  const databasePath = env.DATABASE_PATH ?? ".data/scope.sqlite";
  if (!databasePath.trim() || databasePath.includes("\0")
    || (env.AI_USAGE_ENABLED !== undefined && !["true", "false"].includes(env.AI_USAGE_ENABLED))) {
    throw new AppError("CONFIG_REQUIRED", "Invalid application configuration.", 503);
  }
  return {
    appOrigin, databasePath,
    paypalClientId: env.PAYPAL_CLIENT_ID ?? "", paypalClientSecret: env.PAYPAL_CLIENT_SECRET ?? "",
    paypalMerchantId: env.PAYPAL_MERCHANT_ID ?? "", paypalWebhookId: env.PAYPAL_WEBHOOK_ID ?? "",
    vyceApiKey: env.VYCEAI_API_KEY ?? "", vyceModel: env.VYCEAI_MODEL ?? "deepseek-v4-flash",
    aiUsageEnabled: env.AI_USAGE_ENABLED === "true",
  };
}
