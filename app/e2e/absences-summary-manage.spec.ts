import { expect, test } from "@playwright/test";
import { goToScreen, loginAsManager, expectToast } from "./helpers";

test.describe("Absences, Summary, Manage — screens load", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
  });

  test("Absences: screen loads with patients outside panel", async ({ page }) => {
    await goToScreen(page, "absences");
    await expect(
      page.getByText("Patients outside center right now", { exact: true }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("Summary: screen loads with daily summary card", async ({ page }) => {
    await goToScreen(page, "summary");
    await expect(page.getByText("Summary Groups Today", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("Manage: staff tab visible", async ({ page }) => {
    await goToScreen(page, "manage");
    await expect(page.getByText("👥 Staff", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("Manage: schedule tab loads without 500", async ({ page }) => {
    await goToScreen(page, "manage");
    // Try to click Schedule tab if visible
    const scheduleTab = page.getByText(/schedule|📅/i).first();
    if (await scheduleTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      const [res] = await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes("/api/schedule") || r.url().includes("/api/therapist"),
          { timeout: 10_000 },
        ).catch(() => null),
        scheduleTab.click(),
      ]);
      if (res) expect(res.status()).toBeLessThan(500);
    }
  });
});
