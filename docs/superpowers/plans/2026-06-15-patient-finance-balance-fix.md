# Patient Profile Finance Tab — Balance/History Ordering Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix `PatientProfile.jsx`'s Finance tab so the displayed account balance is the patient's current balance (from the most recent transaction) and the transaction history list is shown newest-first, instead of both being derived from a meaningless UUID-string sort.

**Architecture:** One-line-equivalent frontend fix in `app/src/pages/PatientProfile.jsx`: replace the `pFin` sort comparator (currently `b.id.localeCompare(a.id)`, sorting by random UUID) with `new Date(b.createdAt) - new Date(a.createdAt)` (newest-first by creation time), and change `balance` to read `pFin[0].balance` (the most recent transaction's balance snapshot) instead of `pFin[pFin.length - 1].balance`. This mirrors the already-correct pattern in `Finance.jsx`. No rendering/JSX changes needed — the existing balance card and transaction list consume `pFin`/`balance` unchanged.

**Tech Stack:** React (JSX), Playwright e2e tests.

---

## File Structure

- Modify: `app/src/pages/PatientProfile.jsx` — fix `pFin` sort and `balance` computation in the Finance tab
- Modify: `app/e2e/forms-crud.spec.ts` — add e2e test for correct balance/ordering

---

### Task 1: Fix `pFin` sort and `balance` computation in the Finance tab

**Files:**
- Modify: `app/src/pages/PatientProfile.jsx:327-328`

- [ ] **Step 1: Replace the buggy sort/balance lines**

In `app/src/pages/PatientProfile.jsx`, inside the Finance tab's IIFE, find:

```jsx
            const pFin = (finance || []).filter((f) => f.patientId === pid).sort((a, b) => b.id.localeCompare(a.id));
            const balance = pFin.length ? pFin[pFin.length - 1].balance ?? 0 : 0;
```

Replace with:

```jsx
            const pFin = (finance || []).filter((f) => f.patientId === pid).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const balance = pFin.length ? pFin[0].balance ?? 0 : 0;
```

No other lines in the Finance tab change. The full block (lines 326-329) should now read:

```jsx
          {(() => {
            const pFin = (finance || []).filter((f) => f.patientId === pid).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const balance = pFin.length ? pFin[0].balance ?? 0 : 0;
            return (
```

- [ ] **Step 2: Commit**

```bash
git add app/src/pages/PatientProfile.jsx
git commit -m "fix: sort patient finance history by createdAt and show current balance"
```

---

### Task 2: Add e2e coverage for balance and history ordering

**Files:**
- Modify: `app/e2e/forms-crud.spec.ts`

- [ ] **Step 1: Add the test**

Add this new test inside the `test.describe("Forms, validation, and creates", ...)` block in `app/e2e/forms-crud.spec.ts`, after the existing `"MedManager: medication summary groups medications by time of day"` test (i.e. as the last test in the file, just before the closing `});`):

```typescript
  test("Patients: profile Finance tab shows current balance and newest-first history", async ({ page }) => {
    await goToScreen(page, "finance");
    await page.waitForLoadState("networkidle");

    const patientSelect = page
      .locator("label", { hasText: "Select Patient" })
      .locator("xpath=following-sibling::select");
    await expect(async () => {
      const n = await patientSelect.locator("option").count();
      if (n < 1) throw new Error("patient select has no options yet");
    }).toPass({ timeout: 20_000 });
    await patientSelect.selectOption({ index: 0 });
    const patientName = (await patientSelect.locator("option:checked").textContent())?.trim() ?? "";

    const base = Date.now() % 1000;
    const depositAmount = String(100 + (base % 50));
    const withdrawalAmount = String(50 + (base % 40));

    await page.getByRole("button", { name: "+ Deposit" }).click();
    let dialog = page.getByRole("dialog", { name: "💰 Deposit to Patient" });
    await dialog.getByPlaceholder("500").fill(depositAmount);
    const depositPost = page.waitForResponse(
      (r) => r.url().includes("/api/finance/patient") && r.request().method() === "POST",
    );
    await dialog.getByRole("button", { name: "✓ Save" }).click();
    await depositPost;
    await expectToast(page, /Deposit recorded/);

    await page.getByRole("button", { name: "+ Withdrawal" }).click();
    dialog = page.getByRole("dialog", { name: "💸 Withdrawal from Patient" });
    await dialog.getByPlaceholder("500").fill(withdrawalAmount);
    const withdrawalPost = page.waitForResponse(
      (r) => r.url().includes("/api/finance/patient") && r.request().method() === "POST",
    );
    await dialog.getByRole("button", { name: "✓ Save" }).click();
    const withdrawalRes = await withdrawalPost;
    await expectToast(page, /Withdrawal recorded/);
    const { balance: expectedBalance } = await withdrawalRes.json();

    await goToScreen(page, "patients");
    await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 20_000 });
    await page.locator("tbody tr", { hasText: patientName }).first().click();

    const profile = page.getByRole("dialog");
    await profile.getByText("💰 General").click();

    await expect(profile.getByText(`₪${Number(expectedBalance).toLocaleString()}`)).toBeVisible();

    const dialogText = await profile.textContent();
    const depositIndex = dialogText.indexOf(`+₪${depositAmount}`);
    const withdrawalIndex = dialogText.indexOf(`-₪${withdrawalAmount}`);
    expect(depositIndex).toBeGreaterThan(-1);
    expect(withdrawalIndex).toBeGreaterThan(-1);
    expect(withdrawalIndex).toBeLessThan(depositIndex);
  });
```

This test: selects the first patient on the Finance screen, records a deposit then a withdrawal with distinct, non-overlapping amounts, captures the resulting balance from the withdrawal's API response, opens that patient's profile, switches to the Finance tab (`💰 General`), and asserts (1) the displayed balance equals the balance returned after the withdrawal (the most recent transaction), and (2) the withdrawal row appears before the deposit row in the transaction list (newest-first).

- [ ] **Step 2: Run the test to verify it passes**

Backend must be running first (`cd backend && ./gradlew bootRun`), or set `PLAYWRIGHT_BASE_URL`/`PLAYWRIGHT_SKIP_WEBSERVER` per `app/playwright.config.ts`.

Run: `cd app && npx playwright test forms-crud -g "shows current balance and newest-first history"`
Expected: PASS

- [ ] **Step 3: Run the full forms-crud e2e file to check for regressions**

Run: `cd app && npx playwright test forms-crud`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add app/e2e/forms-crud.spec.ts
git commit -m "test: e2e coverage for patient profile finance balance and history ordering"
```

---

## Out of Scope (per spec)

- Role-based access to the Finance tab (unchanged).
- Changes to `Finance.jsx` (already correct).
- Backend changes (balance field semantics are correct, only frontend sort/selection was wrong).
