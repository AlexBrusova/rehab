import { expect, test } from "@playwright/test";
import { goToScreen, loginAsCounselor, loginAsDoctor, loginAsManager } from "./helpers";

test.describe("Vitals history tab", () => {
  test("doctor adds a vitals record and manager sees it", async ({ page }) => {
    await loginAsDoctor(page);
    await goToScreen(page, "patients");
    await page.locator("table tbody tr").first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("dialog").getByText("🩺 Vitals", { exact: true }).click();
    await page.getByRole("button", { name: "+ Add Vitals" }).click();

    await page.getByPlaceholder("Systolic").fill("138");
    await page.getByPlaceholder("Diastolic").fill("90");
    await page.getByPlaceholder("Pulse").fill("80");
    await page.getByPlaceholder("Note (optional)").fill("Borderline pressure - monitor");

    const post = page.waitForResponse(
      (r) => r.url().includes("/api/vitals") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "✓ Add" }).click();
    await post;

    await expect(page.getByText("138/90 | Pulse 80")).toBeVisible();
    await expect(page.getByText("Borderline pressure - monitor")).toBeVisible();
    await page.getByRole("dialog").getByText("✕", { exact: true }).first().click();

    await loginAsManager(page);
    await goToScreen(page, "patients");
    await page.locator("table tbody tr").first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("dialog").getByText("🩺 Vitals", { exact: true }).click();

    await expect(page.getByText("138/90 | Pulse 80")).toBeVisible();
    await expect(page.getByRole("button", { name: "+ Add Vitals" })).not.toBeVisible();
  });

  test("vitals add form requires systolic, diastolic, and pulse", async ({ page }) => {
    await loginAsDoctor(page);
    await goToScreen(page, "patients");
    await page.locator("table tbody tr").first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("dialog").getByText("🩺 Vitals", { exact: true }).click();
    await page.getByRole("button", { name: "+ Add Vitals" }).click();
    await page.getByRole("button", { name: "✓ Add" }).click();

    await expect(page.getByTestId("toast")).toContainText("Please fill Systolic, Diastolic, and Pulse");
  });

  test("counselor does not see the Vitals tab", async ({ page }) => {
    await loginAsCounselor(page);
    await goToScreen(page, "patients");
    await page.locator("table tbody tr").first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });

    await expect(page.getByRole("dialog").getByText("🩺 Vitals", { exact: true })).not.toBeVisible();
  });
});
