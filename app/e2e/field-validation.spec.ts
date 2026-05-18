import { expect, test } from "@playwright/test";
import { loginAsManager, goToScreen } from "./helpers";

test.describe("FI field validation — 4 states", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
  });

  test("name field: shows blue hint on focus, red on blur with short value, green on fix", async ({ page }) => {
    await goToScreen(page, "patients");
    await page.waitForLoadState("networkidle");

    const addBtn = page.getByRole("button", { name: /\+ Add Patient|\+ New/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();

    const nameInput = page.getByPlaceholder("John Doe").first();
    await nameInput.waitFor({ state: "visible", timeout: 5000 });

    // State ①→②: focus shows blue hint text
    await nameInput.focus();
    const hint = page.locator("div").filter({ hasText: /characters|2–255/i }).first();
    await expect(hint).toBeVisible({ timeout: 3000 });

    // State ②→③: blur with 1 char → red error
    await nameInput.fill("А");
    await nameInput.blur();
    const errorMsg = page.locator("div").filter({ hasText: /Minimum 2/i }).first();
    await expect(errorMsg).toBeVisible({ timeout: 3000 });
    await expect(nameInput).toHaveCSS("border-top-color", "rgb(192, 57, 43)");

    // State ③→④: fix → immediately green (no extra blur)
    await nameInput.fill("Иванов Иван");
    await expect(nameInput).toHaveCSS("border-top-color", "rgb(26, 122, 74)");
  });

  test("room: building and capacity fields validate on blur", async ({ page }) => {
    await goToScreen(page, "rooms");
    const addBtn = page.getByRole("button", { name: /\+ Add Room/i });
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();

    // Clear building (pre-filled with "Building A") then blur → required error
    const buildingInput = page.getByPlaceholder(/Building A/i).first();
    await buildingInput.fill("");
    await buildingInput.blur();
    const buildingError = page.locator("div").filter({ hasText: /building name/i }).first();
    await expect(buildingError).toBeVisible({ timeout: 3000 });
    await expect(buildingInput).toHaveCSS("border-top-color", "rgb(192, 57, 43)");

    // Capacity empty → required/range error (sanitizer clamps 999→50 so use empty)
    const capacityInput = page.getByPlaceholder("2").first();
    await capacityInput.fill("");
    await capacityInput.blur();
    const capError = page.locator("div").filter({ hasText: /Number from/i }).first();
    await expect(capError).toBeVisible({ timeout: 3000 });
    await expect(capacityInput).toHaveCSS("border-top-color", "rgb(192, 57, 43)");
  });

  test("meds: name field shows error on blur when empty", async ({ page }) => {
    await goToScreen(page, "medmanager");
    await page.waitForLoadState("networkidle");
    const patBtn = page.locator("button").filter({ hasText: /Medications/ }).first();
    await expect(patBtn).toBeVisible({ timeout: 8000 });
    await patBtn.click();
    const addBtn = page.getByRole("button", { name: /\+ Add Medication/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();

    const nameInput = page.getByPlaceholder(/methadone|e\.g\./i).first();
    await nameInput.waitFor({ state: "visible", timeout: 5000 });
    await nameInput.focus();
    await nameInput.blur();
    const nameError = page.locator("div").filter({ hasText: /medication name/i }).first();
    await expect(nameError).toBeVisible({ timeout: 3000 });
    await expect(nameInput).toHaveCSS("border-top-color", "rgb(192, 57, 43)");
  });

  test("manage: username field shows hint on focus", async ({ page }) => {
    await goToScreen(page, "manage");
    await page.waitForLoadState("networkidle");
    const addBtn = page.getByRole("button", { name: /add staff member/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();

    const usernameInput = page.getByPlaceholder(/user123/i).first();
    await expect(usernameInput).toBeVisible({ timeout: 3000 });
    await usernameInput.focus();
    const hint = page.locator("div").filter({ hasText: /underscore/i }).first();
    await expect(hint).toBeVisible({ timeout: 3000 });
  });
});
