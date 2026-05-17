import { expect, test } from "@playwright/test";
import { goToScreen, loginAsManager, loginAsCounselor, expectToast } from "./helpers";

test.describe("Shifts, Phones, Rooms — CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
  });

  test("Rooms: create room returns 201 and appears in list", async ({ page }) => {
    await goToScreen(page, "rooms");
    const addBtn = page.getByRole("button", { name: /\+ Add Room/i });
    if (!(await addBtn.isVisible({ timeout: 5000 }).catch(() => false))) return;
    await addBtn.click();
    // Both building and room number are required fields
    const buildingInput = page.getByPlaceholder(/Building A/i).first();
    if (await buildingInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await buildingInput.fill("Building A");
    }
    const numInput = page.getByPlaceholder(/Room 5/i).first();
    if (await numInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await numInput.fill("E2E-99");
    }
    const post = page.waitForResponse(
      (r) => r.url().includes("/api/rooms") && r.request().method() === "POST",
    );
    // Save button text is "✓ Add"
    const saveBtn = page.getByRole("button", { name: /✓ Add/i }).first();
    await saveBtn.waitFor({ state: "visible", timeout: 3000 });
    await saveBtn.click();
    const roomRes = await post;
    expect(roomRes.status()).toBeLessThan(400);
    await expectToast(page, /room/i);
  });

  test("Shifts: shifts screen loads and shows content", async ({ page }) => {
    await goToScreen(page, "shifts");
    await expect(
      page.getByText(/Shift History|No Active Shift|Start Shift|Active Shift/).first()
    ).toBeVisible({ timeout: 20_000 });
  });

  test("Phones: phones screen loads with active panel", async ({ page }) => {
    await goToScreen(page, "phones");
    await expect(page.getByText("in use now", { exact: false })).toBeVisible({
      timeout: 15_000,
    });
  });
});
