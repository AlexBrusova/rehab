# Patient Profile Consequences Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a "⛔ N Consequences" badge plus a list of affected restriction types in the patient profile header when a patient has any pending or approved consequence.

**Architecture:** Pure frontend change in `app/src/pages/PatientProfile.jsx`. Hoist the existing `typeLabels` map out of the Consequences tab into a component-level constant, compute `pActiveCons` (pending/approved consequences for this patient), and render a new badge + type-list line in the header when `pActiveCons.length > 0`. Add one new i18n key (`patientProfile.consequencesLabel`).

**Tech Stack:** React (JSX), i18n via `t()` and `en.js`/`he.js`, Vitest for i18n parity test, Playwright for e2e.

---

## File Structure

- Modify: `app/src/i18n/en.js` — add `patientProfile.consequencesLabel`
- Modify: `app/src/i18n/he.js` — add matching Hebrew translation
- Modify: `app/src/pages/PatientProfile.jsx` — hoist `typeLabels`, add `pActiveCons`, render header badge + type list
- Modify: `app/e2e/forms-crud.spec.ts` — add e2e test for the new badge

---

### Task 1: Add `consequencesLabel` i18n key

**Files:**
- Modify: `app/src/i18n/en.js:177`
- Modify: `app/src/i18n/he.js:9`
- Test: `app/src/i18n/i18n.test.js` (existing parity test, no changes needed)

- [ ] **Step 1: Add the key to `en.js`**

In `app/src/i18n/en.js`, find line 177 (`consequencesTab: "⛔ Consequences",`) and add a new key right after it:

```javascript
    consequencesTab: "⛔ Consequences",
    consequencesLabel: "Consequences",
```

- [ ] **Step 2: Add the matching key to `he.js`**

In `app/src/i18n/he.js`, the `patientProfile` block is a single-line object (line 9). Find `consequencesTab: "⛔ תוצאות",` inside that object and add `consequencesLabel` right after it:

```javascript
consequencesTab: "⛔ תוצאות", consequencesLabel: "השלכות",
```

(Keep everything else on that line unchanged — just insert the new key/value pair after `consequencesTab`'s entry.)

- [ ] **Step 3: Run the i18n parity test**

Run: `cd app && npx vitest run src/i18n/i18n.test.js`
Expected: PASS (no missing/extra keys between `en.js` and `he.js`)

- [ ] **Step 4: Commit**

```bash
git add app/src/i18n/en.js app/src/i18n/he.js
git commit -m "feat: add consequencesLabel i18n key for patient profile summary"
```

---

### Task 2: Hoist `typeLabels` and compute `pActiveCons`

**Files:**
- Modify: `app/src/pages/PatientProfile.jsx:48-50` (add constants after `pTherapy`)
- Modify: `app/src/pages/PatientProfile.jsx:293-294` (remove now-duplicate local definitions)

- [ ] **Step 1: Add `typeLabels` and `pActiveCons` after the existing filters**

In `app/src/pages/PatientProfile.jsx`, the existing filters (lines 48-50) read:

```jsx
  const room = rooms.find((r) => r.id === p?.roomId);
  const pMeds = meds.filter((m) => m.patientId === pid);
  const pTherapy = therapy.filter((th) => th.patientId === pid);
  if (!p) return null;
```

Add the following immediately after `pTherapy`, before `if (!p) return null;`:

```jsx
  const typeLabels = { phone: "📵 Phone Restriction", visit: "🏠 Cancel Home Visit", cigarettes: "🚬 Cigarette Restriction", other: "📝 Other" };
  const pActiveCons = (consequences || []).filter(
    (c) => c.patientId === pid && (c.status === "pending" || c.status === "approved")
  );
```

Result:

```jsx
  const room = rooms.find((r) => r.id === p?.roomId);
  const pMeds = meds.filter((m) => m.patientId === pid);
  const pTherapy = therapy.filter((th) => th.patientId === pid);
  const typeLabels = { phone: "📵 Phone Restriction", visit: "🏠 Cancel Home Visit", cigarettes: "🚬 Cigarette Restriction", other: "📝 Other" };
  const pActiveCons = (consequences || []).filter(
    (c) => c.patientId === pid && (c.status === "pending" || c.status === "approved")
  );
  if (!p) return null;
```

- [ ] **Step 2: Remove the duplicate local `typeLabels` and `pCons` from the Consequences tab**

In the same file, the Consequences tab (around line 290-309) currently reads:

```jsx
      {/* CONSEQUENCES TAB */}
      {tab === "cons" && (
        <div>
          {(() => {
            const pCons = (consequences || []).filter((c) => c.patientId === pid);
            const typeLabels = { phone: "📵 Phone Restriction", visit: "🏠 Cancel Home Visit", cigarettes: "🚬 Cigarette Restriction", other: "📝 Other" };
            if (pCons.length === 0) return <div style={{ textAlign: "center", padding: 20, color: C.soft, fontSize: 13 }}>{t('patientProfile.noConsequenceRecords')}</div>;
            return pCons.map((c) => (
```

Replace with (drop the two local `const` lines, keep using `pCons` as the full unfiltered list — the tab shows ALL consequences regardless of status, unlike the new header summary which only counts active ones):

```jsx
      {/* CONSEQUENCES TAB */}
      {tab === "cons" && (
        <div>
          {(() => {
            const pCons = (consequences || []).filter((c) => c.patientId === pid);
            if (pCons.length === 0) return <div style={{ textAlign: "center", padding: 20, color: C.soft, fontSize: 13 }}>{t('patientProfile.noConsequenceRecords')}</div>;
            return pCons.map((c) => (
```

The rest of the tab body (the `typeLabels[c.type] || c.type` usage etc.) is unchanged — it now refers to the component-level `typeLabels` constant from Step 1.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/PatientProfile.jsx
git commit -m "refactor: hoist typeLabels and add pActiveCons in PatientProfile"
```

---

### Task 3: Render the consequences badge and type list in the header

**Files:**
- Modify: `app/src/pages/PatientProfile.jsx:141-146`

- [ ] **Step 1: Add the badge and type-list line**

The header badges block (lines 141-146) currently reads:

```jsx
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            <Badge type="teal">💊 {pMeds.length} {t('patientProfile.medications')}</Badge>
            <Badge type={p.status === "away" ? "yellow" : "green"}>
              {p.status === "away" ? `🏠 ${p.awayType}` : t('patientProfile.activeStatus')}
            </Badge>
          </div>
```

Replace with:

```jsx
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            <Badge type="teal">💊 {pMeds.length} {t('patientProfile.medications')}</Badge>
            <Badge type={p.status === "away" ? "yellow" : "green"}>
              {p.status === "away" ? `🏠 ${p.awayType}` : t('patientProfile.activeStatus')}
            </Badge>
            {pActiveCons.length > 0 && (
              <Badge type="orange">⛔ {pActiveCons.length} {t('patientProfile.consequencesLabel')}</Badge>
            )}
          </div>
          {pActiveCons.length > 0 && (
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
              {[...new Set(pActiveCons.map((c) => typeLabels[c.type] || c.type))].join(", ")}
            </div>
          )}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/pages/PatientProfile.jsx
git commit -m "feat: show active consequences summary badge on patient profile header"
```

---

### Task 4: Add e2e coverage

**Files:**
- Modify: `app/e2e/forms-crud.spec.ts`

- [ ] **Step 1: Add the test**

Add this new test inside the `test.describe("Forms, validation, and creates", ...)` block in `app/e2e/forms-crud.spec.ts`, after the existing `"Consequences: propose with patient and description"` test:

```typescript
  test("Patients: active consequence shows badge and type on profile", async ({ page }) => {
    await goToScreen(page, "consequences");
    await page.getByRole("button", { name: "+ Propose" }).click();
    const dialog = page.getByRole("dialog", { name: /Propose Consequence/i });
    const patientSelect = dialog.locator("select").first();
    await expect(async () => {
      const n = await patientSelect.locator("option").count();
      if (n < 1) throw new Error("patient select has no options yet");
    }).toPass({ timeout: 20_000 });
    await patientSelect.selectOption({ index: 0 });
    const patientName = (await patientSelect.locator("option:checked").textContent())?.trim();
    await dialog
      .getByPlaceholder("e.g.: Phone Restriction 3 days")
      .fill("E2E active consequence");
    await dialog.getByRole("button", { name: "✓ Propose" }).click();
    await expectToast(page, /Consequence proposed/);

    await goToScreen(page, "patients");
    await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 20_000 });
    await page.locator("tbody tr", { hasText: patientName }).first().click();

    const profile = page.getByRole("dialog");
    await expect(profile.getByText(/^⛔ \d+ Consequences$/)).toBeVisible();
    await expect(profile.getByText(/📵 Phone Restriction/)).toBeVisible();
  });
```

- [ ] **Step 2: Run the test to verify it passes**

Backend must be running first (`cd backend && ./gradlew bootRun`), or set `PLAYWRIGHT_BASE_URL`/`PLAYWRIGHT_SKIP_WEBSERVER` per `app/playwright.config.ts`.

Run: `cd app && npx playwright test forms-crud -g "active consequence shows badge"`
Expected: PASS

- [ ] **Step 3: Run the full forms-crud e2e file to check for regressions**

Run: `cd app && npx playwright test forms-crud`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add app/e2e/forms-crud.spec.ts
git commit -m "test: e2e coverage for patient profile consequences summary badge"
```

---

## Out of Scope (per spec)

- Clicking the badge to switch to the Consequences tab.
- Changes to the Consequences tab's own status filtering/display.
- Backend/API changes.
