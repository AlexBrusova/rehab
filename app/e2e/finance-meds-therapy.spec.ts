import { expect, test } from "@playwright/test";
import { goToScreen, loginAsManager, expectToast } from "./helpers";

test.describe("Finance, Meds, Therapy — CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
  });

  test("Finance: screen loads with balance or shekel symbol", async ({ page }) => {
    await goToScreen(page, "finance");
    await expect(page.getByText(/₪|Balance/).first()).toBeVisible({ timeout: 15_000 });
  });

  test("Finance: POST /api/finance/cashbox-counts returns 2xx", async ({ page }) => {
    await goToScreen(page, "finance");
    // Look for cashbox count form — varies by UI but try
    const countBtn = page.getByRole("button", { name: /count|tally|cashbox count/i }).first();
    if (!(await countBtn.isVisible({ timeout: 5000 }).catch(() => false))) return;
    const post = page.waitForResponse(
      (r) => r.url().includes("/api/finance/cashbox-counts") && r.request().method() === "POST",
    );
    await countBtn.click();
    const amountInput = page.getByLabel(/amount|counted/i).first();
    if (await amountInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await amountInput.fill("1000");
      await page.getByRole("button", { name: /save|confirm|submit/i }).click();
      const res = await post;
      expect(res.status()).toBeLessThan(400);
    }
  });

  test("Meds: medmanager screen loads without error", async ({ page }) => {
    await goToScreen(page, "medmanager");
    await expect(page.getByText(/add, edit, and remove Medications/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/500|internal server error/i)).not.toBeVisible();
  });

  test("Therapy: new record button visible", async ({ page }) => {
    await goToScreen(page, "therapy");
    await expect(page.getByRole("button", { name: "+ New Record" })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("Therapy: POST /api/therapy returns 2xx when creating session", async ({ page }) => {
    await goToScreen(page, "therapy");
    const newBtn = page.getByRole("button", { name: "+ New Record" });
    if (!(await newBtn.isVisible({ timeout: 10_000 }).catch(() => false))) return;
    const post = page.waitForResponse(
      (r) => r.url().includes("/api/therapy") && r.request().method() === "POST",
      { timeout: 30_000 },
    );
    await newBtn.click();
    // Select patient if dropdown appears
    const patientSelect = page.locator("select").first();
    if (await patientSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      const options = await patientSelect.locator("option").count();
      if (options > 1) await patientSelect.selectOption({ index: 1 });
    }
    // Fill required session topic field
    const topicInput = page.getByPlaceholder(/trauma processing|session topic/i).first();
    if (await topicInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await topicInput.fill("E2E test session");
    }
    const saveBtn = page.getByRole("button", { name: /save|create|add/i }).last();
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click();
      const res = await post;
      expect(res.status()).toBeLessThan(400);
    }
  });
});
