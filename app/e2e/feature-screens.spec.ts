import { expect, test } from "@playwright/test";
import { goToScreen, loginAsManager } from "./helpers";

/**
 * Each screen exposes at least one stable anchor after navigation (guards blank / crashed views).
 */
test.describe("Feature screens (manager)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
  });

  test("rooms: occupancy summary", async ({ page }) => {
    await goToScreen(page, "rooms");
    await expect(page.getByText(/occupied|Vacant/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("medmanager: prescription copy", async ({ page }) => {
    await goToScreen(page, "medmanager");
    await expect(page.getByText(/add, edit, and remove Medications/i)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("medications: shift selector", async ({ page }) => {
    await goToScreen(page, "medications");
    await expect(page.getByText(/Morning 09:00|Evening 20:00/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("phones: active phones panel", async ({ page }) => {
    await goToScreen(page, "phones");
    await expect(page.getByText("in use now", { exact: false })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("absences: outside list card", async ({ page }) => {
    await goToScreen(page, "absences");
    await expect(
      page.getByText("Patients outside center right now", { exact: true }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("summary: groups summary card", async ({ page }) => {
    await goToScreen(page, "summary");
    await expect(page.getByText("Summary Groups Today", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("shifts: history or start CTA", async ({ page }) => {
    await goToScreen(page, "shifts");
    await expect(
      page.getByText(/Shift History|No Active Shift|Start Shift/).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("finance: shekel or balance label", async ({ page }) => {
    await goToScreen(page, "finance");
    await expect(page.getByText(/₪|Balance/).first()).toBeVisible({ timeout: 15_000 });
  });

  test("manage: staff tab", async ({ page }) => {
    await goToScreen(page, "manage");
    await expect(page.getByText("👥 Staff", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("therapy: new record CTA", async ({ page }) => {
    await goToScreen(page, "therapy");
    await expect(page.getByRole("button", { name: "+ New Record" })).toBeVisible({
      timeout: 15_000,
    });
  });
});
