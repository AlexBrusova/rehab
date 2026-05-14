import { expect, test } from "@playwright/test";
import { loginAsManager, loginAsOrgManager } from "./helpers";

test.describe("Dashboard — Status Patients", () => {
  test("manager: table and patient row open profile without hang", async ({ page }) => {
    await loginAsManager(page);
    await expect(page.getByText("Status Patients", { exact: true })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator("th", { hasText: "Emotional Status" })).toBeVisible();
    const statusTable = page.locator("table").filter({
      has: page.locator("th", { hasText: "Emotional Status" }),
    });
    await expect(statusTable.locator("tbody tr").first()).toBeVisible({ timeout: 20_000 });
    await statusTable.getByTestId("dashboard-status-patient-row").first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("dialog").getByText(/Medications|Days in Center/).first(),
    ).toBeVisible({ timeout: 5000 });
    await page.getByRole("dialog").getByText("✕", { exact: true }).first().click();
    await expect(page.getByTestId("page-title")).toHaveText("Dashboard");
  });

  test("org_manager: dashboard renders (multi-house top bar safe)", async ({ page }) => {
    await loginAsOrgManager(page);
    await expect(page.getByText("Status Patients", { exact: true })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 20_000 });
  });
});
