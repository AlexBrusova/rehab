import { expect, test } from "@playwright/test";
import { goToScreen, loginAsManager, expectToast } from "./helpers";

test.describe("Forms, validation, and creates", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
  });

  test("Patients: empty DOB shows validation (server-required fields)", async ({
    page,
  }) => {
    await goToScreen(page, "patients");
    await page.getByRole("button", { name: "+ Add Patient" }).click();
    await page.getByPlaceholder("John Doe").fill("E2E No DOB");
    await page.getByRole("button", { name: "✓ Add" }).click();
    await expectToast(page, /Date of Birth/);
  });

  test("Patients: create with DOB and default admit date", async ({ page }) => {
    const suffix = Date.now();
    const name = `E2E Patient ${suffix}`;
    await goToScreen(page, "patients");
    await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "+ Add Patient" }).click();
    await page.getByPlaceholder("John Doe").fill(name);
    await page.getByPlaceholder("000000000").fill(String(suffix).slice(-9));
    await page.getByPlaceholder("DD/MM/YYYY").first().fill("15/06/1990");
    await page.getByRole("button", { name: "✓ Add" }).click();
    await expectToast(page, /Patient added successfully/);
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  });

  test("Groups: empty topic shows validation", async ({ page }) => {
    await goToScreen(page, "groups");
    await page.getByRole("button", { name: "+ Open New Group" }).click();
    await page.getByRole("button", { name: "▶ Open and mark Attendance" }).click();
    await expectToast(page, /Please enter a Topic/);
  });

  test("Groups: open session creates group via API", async ({ page }) => {
    const topic = `E2E Group ${Date.now()}`;
    await goToScreen(page, "groups");
    const post = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        r.url().includes("/api/groups") &&
        r.ok(),
    );
    await page.getByRole("button", { name: "+ Open New Group" }).click();
    await page
      .getByPlaceholder("e.g.: Group Therapy, Skills workshop...")
      .fill(topic);
    await page.getByRole("button", { name: "▶ Open and mark Attendance" }).click();
    const res = await post;
    const body = await res.json();
    expect(body.id, "group id from API").toBeTruthy();
    expect(body.topic).toContain("E2E Group");
    await expectToast(page, /Group opened/);
  });

  test("Consequences: validation without patient or description", async ({
    page,
  }) => {
    await goToScreen(page, "consequences");
    await page.getByRole("button", { name: "+ Propose" }).click();
    await page.getByRole("button", { name: "✓ Propose" }).click();
    await expectToast(page, /select a patient and fill Description/);
  });

  test("Consequences: propose with patient and description", async ({
    page,
  }) => {
    await goToScreen(page, "patients");
    await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 20_000 });
    await goToScreen(page, "consequences");
    await page.getByRole("button", { name: "+ Propose" }).click();
    const dialog = page.getByRole("dialog", { name: /Propose Consequence/i });
    const patientSelect = dialog.locator("select").first();
    await expect(async () => {
      const n = await patientSelect.locator("option").count();
      if (n < 1) throw new Error("patient select has no options yet");
    }).toPass({ timeout: 20_000 });
    await patientSelect.selectOption({ index: 0 });
    await dialog
      .getByPlaceholder("e.g.: Phone Restriction 3 days")
      .fill("E2E consequence description");
    await dialog.getByRole("button", { name: "✓ Propose" }).click();
    await expectToast(page, /Consequence proposed/);
  });
});
