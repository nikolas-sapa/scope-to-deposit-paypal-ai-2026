import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { getConfig, loadEnvironment } from "../src/server/config";
import { getDatabase } from "../src/server/db";
import { checkPayPalAccess } from "../src/server/paypal";

async function main(): Promise<void> {
  loadEnvironment();
  const config = getConfig();
  const configured = Boolean(config.paypalClientId && config.paypalClientSecret && config.paypalMerchantId);
  let paypalStatus = "NOT_CONFIGURED";
  if (configured) {
    try { paypalStatus = (await checkPayPalAccess({ request: new Request(`${config.appOrigin}/api/health`), config, db: getDatabase(config), now: Date.now, responseHeaders: new Headers() })).authenticated ? "OAUTH_VERIFIED" : "OAUTH_FAILED"; }
    catch { paypalStatus = "OAUTH_FAILED"; }
  }
  const report = { checkedAt: new Date().toISOString(), sandboxOnly: true, paypalStatus, webhookConfigured: Boolean(config.paypalWebhookId), aiConfigured: Boolean(config.vyceApiKey), aiUsageEnabled: config.aiUsageEnabled, note: "OAuth access only. No order, capture, buyer access, webhook registration or AI generation performed." };
  const path = resolve(".data/access-report.json");
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  writeFileSync(path, JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
  console.log(`Sandbox access: ${paypalStatus}. Report: ${path}`);
  if (paypalStatus !== "OAUTH_VERIFIED") process.exitCode = 2;
}
main().catch(() => { console.error("Access check unavailable. Verify local configuration."); process.exitCode = 1; });
