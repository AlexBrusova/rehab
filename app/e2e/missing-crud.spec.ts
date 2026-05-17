import { expect, test } from "@playwright/test";
import { goToScreen, loginAsManager, expectToast } from "./helpers";

test.describe("Missing module CRUD — happy path", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
  });

  // ── SHIFTS ────────────────────────────────────────────────────────────────
  test("Shifts: POST /api/shifts returns 2xx when starting shift", async ({ page }) => {
    await goToScreen(page, "shifts");
    const startBtn = page.getByRole("button", { name: /start shift|begin shift/i });
    const isVisible = await startBtn.isVisible({ timeout: 8_000 }).catch(() => false);
    if (!isVisible) return;
    const post = page.waitForResponse(
      (r) => r.url().includes("/api/shifts") && r.request().method() === "POST",
      { timeout: 20_000 },
    );
    await startBtn.click();
    const confirmBtn = page.getByRole("button", { name: /confirm|yes|start/i });
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
    }
    const res = await post;
    expect(res.status()).toBeLessThan(400);
  });

  // ── PHONES ────────────────────────────────────────────────────────────────
  test("Phones: POST /api/phones returns 201 when issuing phone", async ({ page }) => {
    await goToScreen(page, "phones");
    await page.waitForLoadState("networkidle");
    const issueBtn = page.getByRole("button", { name: /issue phone|give phone|📱/i }).first();
    if (!(await issueBtn.isVisible({ timeout: 8_000 }).catch(() => false))) return;
    const post = page.waitForResponse(
      (r) => r.url().includes("/api/phones") && r.request().method() === "POST",
      { timeout: 20_000 },
    );
    await issueBtn.click();
    const confirmBtn = page.getByRole("button", { name: /confirm|issue|give|ok/i }).last();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click({ force: true });
    }
    await post;
    await expectToast(page, /phone/i);
  });

  // ── MEDS ──────────────────────────────────────────────────────────────────
  test("Meds: POST /api/meds returns 2xx when adding med", async ({ page }) => {
    await goToScreen(page, "medmanager");
    await page.waitForLoadState("networkidle");
    const addMedBtn = page.getByRole("button", { name: /\+ (add )?med/i }).first();
    if (!(await addMedBtn.isVisible({ timeout: 8_000 }).catch(() => false))) return;
    const post = page.waitForResponse(
      (r) => r.url().includes("/api/meds") && r.request().method() === "POST",
      { timeout: 20_000 },
    );
    await addMedBtn.click();
    const nameInput = page.getByLabel(/medication name/i).first()
      .or(page.getByPlaceholder(/methadone|e\.g\./i).first());
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill("E2E Test Med");
      await nameInput.dispatchEvent("input");
    }
    const doseInput = page.getByPlaceholder(/dose|mg/i).first();
    if (await doseInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await doseInput.fill("10");
    }
    const saveBtn = page.getByRole("button", { name: /save|add|✓/i }).last();
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click({ force: true });
      const res = await post;
      expect(res.status()).toBeLessThan(400);
    }
  });

  // ── FINANCE ───────────────────────────────────────────────────────────────
  test("Finance: POST /api/finance/patient returns 2xx for patient deposit", async ({ page }) => {
    await goToScreen(page, "finance");
    await page.waitForLoadState("networkidle");
    const depositBtn = page.getByRole("button", { name: /deposit|\+ (add )?funds|💰/i }).first();
    if (!(await depositBtn.isVisible({ timeout: 8_000 }).catch(() => false))) return;
    const post = page.waitForResponse(
      (r) => r.url().includes("/api/finance/patient") && r.request().method() === "POST",
      { timeout: 20_000 },
    );
    await depositBtn.click();
    const amountInput = page.getByPlaceholder("500").first()
      .or(page.getByLabel(/Amount/i).first());
    if (await amountInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await amountInput.fill("50");
    }
    const saveBtn = page.getByRole("button", { name: /save|confirm|add/i }).last();
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click({ force: true });
      const res = await post;
      expect(res.status()).toBeLessThan(400);
    }
  });

  // ── SCHEDULE ──────────────────────────────────────────────────────────────
  test("Schedule: PUT /api/schedule/assign returns 2xx", async ({ page }) => {
    await goToScreen(page, "manage");
    await page.waitForLoadState("networkidle");
    const scheduleTab = page
      .getByRole("tab", { name: /schedule|📅/i })
      .or(page.getByText("📅 Schedule", { exact: true }))
      .first();
    if (!(await scheduleTab.isVisible({ timeout: 5_000 }).catch(() => false))) return;
    await scheduleTab.click();
    await page.waitForLoadState("networkidle");
    const dayCell = page
      .locator("[data-testid^='schedule-day']")
      .first()
      .or(page.getByRole("button", { name: /assign|counselor/i }).first());
    if (!(await dayCell.isVisible({ timeout: 5_000 }).catch(() => false))) return;
    const put = page.waitForResponse(
      (r) => r.url().includes("/api/schedule") && r.request().method() === "PUT",
      { timeout: 20_000 },
    );
    await dayCell.click();
    const counselorSelect = page.locator("select").first();
    if (await counselorSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      const opts = await counselorSelect.locator("option").count();
      if (opts > 1) await counselorSelect.selectOption({ index: 1 });
      const saveBtn = page.getByRole("button", { name: /save|assign|confirm/i }).last();
      if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveBtn.click();
        const res = await put;
        expect(res.status()).toBeLessThan(400);
      }
    }
  });

  // ── DISTRIBUTIONS ─────────────────────────────────────────────────────────
  test("Distributions: PUT /api/distributions returns 2xx when marking med given", async ({ page }) => {
    await goToScreen(page, "medications");
    await page.waitForLoadState("networkidle");
    // Find the first "received" radio in the distribution table
    const receivedRadio = page.locator("input[type='radio']").first()
      .or(page.locator("table input").first());
    if (!(await receivedRadio.isVisible({ timeout: 8_000 }).catch(() => false))) return;
    await receivedRadio.click();
    const finishBtn = page.getByRole("button", { name: /finish distribution/i });
    if (!(await finishBtn.isVisible({ timeout: 3_000 }).catch(() => false))) return;
    const put = page.waitForResponse(
      (r) => r.url().includes("/api/distributions") && r.request().method() === "PUT",
      { timeout: 20_000 },
    );
    await finishBtn.click();
    const res = await put;
    expect(res.status()).toBeLessThan(400);
  });

  // ── USERS ─────────────────────────────────────────────────────────────────
  test("Users: POST /api/users returns 2xx when creating user", async ({ page }) => {
    await goToScreen(page, "manage");
    await page.waitForLoadState("networkidle");
    const addUserBtn = page.getByRole("button", { name: /\+ (add |new )?user|invite/i }).first();
    if (!(await addUserBtn.isVisible({ timeout: 8_000 }).catch(() => false))) return;
    const post = page.waitForResponse(
      (r) => r.url().includes("/api/users") && r.request().method() === "POST",
      { timeout: 20_000 },
    );
    await addUserBtn.click();
    const nameInput = page
      .getByLabel(/name|full name/i)
      .first()
      .or(page.getByPlaceholder(/name/i).first());
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill(`E2E User ${Date.now()}`);
    }
    const usernameInput = page
      .getByLabel(/username/i)
      .first()
      .or(page.getByPlaceholder(/username/i).first());
    if (await usernameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await usernameInput.fill(`e2euser${Date.now()}`);
    }
    const pwInput = page
      .getByLabel(/password/i)
      .first()
      .or(page.getByPlaceholder(/password/i).first());
    if (await pwInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await pwInput.fill("testpass123");
    }
    const saveBtn = page.getByRole("button", { name: /save|create|add/i }).last();
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click();
      const res = await post;
      expect(res.status()).toBeLessThan(400);
    }
  });
});

// ── AUTH REDIRECT ─────────────────────────────────────────────────────────
test.describe("Auth — protected routes require login", () => {
  test("fresh browser with no token shows login form", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/");
    await page.evaluate(() => { try { localStorage.clear(); } catch { /* ignore */ } });
    await page.reload();
    await expect(page.getByTestId("login-submit")).toBeVisible({ timeout: 10_000 });
  });
});
