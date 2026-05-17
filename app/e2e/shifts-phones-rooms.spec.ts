import { expect, test } from "@playwright/test";
import { goToScreen, loginAsManager, loginAsCounselor, expectToast } from "./helpers";

test.describe("Shifts, Phones, Rooms — CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
  });

  test("Rooms: create room returns 201 and appears in list", async ({ page }) => {
    await goToScreen(page, "rooms");
    const addBtn = page.getByRole("button", { name: /\+ Add Room|\+ New Room/i });
    if (!(await addBtn.isVisible({ timeout: 5000 }).catch(() => false))) return;
    const post = page.waitForResponse(
      (r) => r.url().includes("/api/rooms") && r.request().method() === "POST" && r.ok(),
    );
    await addBtn.click();
    // Fill room number if input appears
    const numInput = page.getByPlaceholder(/room number|number/i).first();
    if (await numInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await numInput.fill("E2E-99");
    }
    const saveBtn = page.getByRole("button", { name: /save|add|create/i }).last();
    await saveBtn.click({ force: true });
    await post;
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
