import { expect, test } from "@playwright/test";
import {
  goToScreen,
  loginAsCounselor,
  loginAsDoctor,
} from "./helpers";

test.describe("Therapy session add form", () => {
  test("doctor documents a session and it appears in the list", async ({ page }) => {
    await loginAsDoctor(page);
    await goToScreen(page, "patients");
    await page.locator("table tbody tr").first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("dialog").getByText("🧠 Therapy", { exact: true }).click();
    await page.getByRole("button", { name: "📝 Document Session" }).click();

    await page.getByPlaceholder("Topic").fill("Initial assessment");
    await page.getByPlaceholder("Notes").fill("Patient is cooperative");

    const post = page.waitForResponse(
      (r) => r.url().includes("/api/therapy") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "✓ Add" }).click();
    await post;

    await expect(page.getByText("Initial assessment")).toBeVisible();
  });

  test("therapy form requires topic before submitting", async ({ page }) => {
    await loginAsDoctor(page);
    await goToScreen(page, "patients");
    await page.locator("table tbody tr").first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("dialog").getByText("🧠 Therapy", { exact: true }).click();
    await page.getByRole("button", { name: "📝 Document Session" }).click();
    await page.getByRole("button", { name: "✓ Add" }).click();

    await expect(page.getByTestId("toast")).toContainText("Topic is required");
  });

  test("counselor does not see the Document Session button", async ({ page }) => {
    await loginAsCounselor(page);
    await goToScreen(page, "patients");
    await page.locator("table tbody tr").first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("dialog").getByText("🧠 Therapy", { exact: true }).click();
    await expect(
      page.getByRole("button", { name: "📝 Document Session" }),
    ).not.toBeVisible();
  });
});
