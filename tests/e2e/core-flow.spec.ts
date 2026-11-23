import { test, expect } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

type OwnerAccess = { username: string; password: string; appOrigin: string };

function ownerAccess(): OwnerAccess | null {
  const path = join(process.cwd(), ".data", "owner-access.json");
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as OwnerAccess;
  } catch {
    return null;
  }
}

test.beforeEach(async ({ page }, info) => {
  if (!ownerAccess()) info.skip(true, "run npm run setup:owner first");
});

test("anonymous session is rejected by the API boundary", async ({ page }) => {
  const response = await page.request.get("/api/engagements");
  expect(response.status()).toBe(401);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await page.locator("#username").fill("owner");
  await page.locator("#password").fill("definitely-wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".alert-error")).toBeVisible();
});

test("owner signs in, approves a quote, checkout capability tracks sandbox config", async ({ page }) => {
  const access = ownerAccess();
  test.skip(!access, "run npm run setup:owner first");
  const health = await (await page.request.get("/api/health")).json() as { paypalConfigured: boolean };

  await page.goto("/");
  await page.locator("#username").fill(access!.username);
  await page.locator("#password").fill(access!.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".engagement-rail")).toBeVisible();
  await expect(page.locator(".signed-in")).toHaveText(access!.username);

  await page.getByRole("button", { name: "Create engagement" }).first().click();
  await expect(page.locator("#brief")).toBeVisible();

  await page.getByRole("button", { name: "Use sample brief" }).click();
  await expect(page.locator("#brief")).not.toHaveValue("");
  await page.locator("#goal").fill("E2E smoke engagement");
  await page.locator("#deliverables").fill("Project index\nContact page");

  await page.getByRole("button", { name: "Add line item" }).click();
  await page.locator("#item-0").fill("Discovery workshop");
  await page.locator("#quantity-0").fill("2");
  await page.locator("#price-0").fill("500");
  await page.locator("#deposit").fill("200");
  await page.locator("#deposit").blur();

  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.locator(".version-mark")).toContainText("DRAFT");

  await page.getByRole("button", { name: "Approve quote" }).click();
  await expect(page.locator(".version-mark")).toContainText("REVISION");
  await expect(page.locator(".approved-summary")).toContainText("Deposit $200.00 USD");
  await expect(page.locator(".approved-summary")).toContainText("Total $1,000.00 USD");
  await expect(page.locator(".engagement-item-state").first()).toHaveText("Quote approved");

  const checkout = page.getByRole("button", { name: "Create buyer checkout link" });
  if (health.paypalConfigured) {
    await expect(checkout).toBeEnabled();
  } else {
    await expect(checkout).toBeDisabled();
    await expect(page.locator(".rail-foot")).toContainText("not configured");
  }
});
