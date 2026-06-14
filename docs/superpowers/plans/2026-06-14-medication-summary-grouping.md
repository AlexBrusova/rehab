# Medication Summary Grouping by Time of Day Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-line "All Medications" summary in MedManager with a grouped, per-time-slot view (Morning/Noon/Evening/Night/No schedule), one line per non-empty slot.

**Architecture:** Pure frontend change in `app/src/pages/MedManager.jsx`. Build an array of summary groups (4 fixed time slots + a synthetic "no schedule" group) from `pMeds`, filter out empty groups, render one line per remaining group. Add one new i18n key (`medManager.noScheduleLabel`) for the "No schedule" section header.

**Tech Stack:** React (JSX), i18n via `t()` function and `en.js`/`he.js` dictionaries, Vitest for i18n parity test, Playwright for e2e.

---

## File Structure

- Modify: `app/src/i18n/en.js` — add `medManager.noScheduleLabel`
- Modify: `app/src/i18n/he.js` — add matching Hebrew translation
- Modify: `app/src/pages/MedManager.jsx` — replace summary rendering (~lines 135-152)
- Modify: `app/e2e/forms-crud.spec.ts` — update the medication summary e2e test (~lines 91-110)

---

### Task 1: Add `noScheduleLabel` i18n key

**Files:**
- Modify: `app/src/i18n/en.js:289`
- Modify: `app/src/i18n/he.js:11`
- Test: `app/src/i18n/i18n.test.js` (existing parity test, no changes needed)

- [ ] **Step 1: Add the key to `en.js`**

In `app/src/i18n/en.js`, find line 289 (`noScheduleSet: "No schedule set",`) and add a new key right after it:

```javascript
    noScheduleSet: "No schedule set",
    noScheduleLabel: "No schedule",
```

- [ ] **Step 2: Add the matching key to `he.js`**

In `app/src/i18n/he.js`, the `medManager` block is a single-line object (line 11). Find `noScheduleSet: "לא הוגדר לוח זמנים",` inside that object and add `noScheduleLabel` right after it:

```javascript
noScheduleSet: "לא הוגדר לוח זמנים", noScheduleLabel: "ללא לוח זמנים",
```

(Keep everything else on that line unchanged — just insert the new key/value pair after `noScheduleSet`'s entry.)

- [ ] **Step 3: Run the i18n parity test**

Run: `cd app && npx vitest run src/i18n/i18n.test.js`
Expected: PASS (no missing/extra keys between `en.js` and `he.js`)

- [ ] **Step 4: Commit**

```bash
git add app/src/i18n/en.js app/src/i18n/he.js
git commit -m "feat: add noScheduleLabel i18n key for medication summary"
```

---

### Task 2: Update e2e test for grouped summary format (RED)

**Files:**
- Modify: `app/e2e/forms-crud.spec.ts:91-110`

This step updates the test to expect the new grouped format. It will FAIL until Task 3 implements the change — that's expected (RED step of TDD).

- [ ] **Step 1: Replace the test body**

Replace the test at `app/e2e/forms-crud.spec.ts:91-110`:

```typescript
  test("MedManager: medication summary shows all medications with schedule", async ({
    page,
  }) => {
    await goToScreen(page, "medmanager");

    await page.getByRole("button", { name: "+ Add Medication" }).click();

    const medName = `E2E Summary Med ${Date.now()}`;
    await page.getByPlaceholder("e.g.: Methadone").fill(medName);
    await page.getByPlaceholder("40").fill("25");
    await page.getByText("Morning", { exact: true }).click();

    const post = page.waitForResponse(
      (r) => r.url().includes("/api/meds") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "✓ Add" }).click();
    await post;

    await expect(page.getByText(`${medName} 25mg — Morning`)).toBeVisible();
  });
```

with:

```typescript
  test("MedManager: medication summary groups medications by time of day", async ({
    page,
  }) => {
    await goToScreen(page, "medmanager");

    await page.getByRole("button", { name: "+ Add Medication" }).click();

    const morningMed = `E2E Morning Med ${Date.now()}`;
    await page.getByPlaceholder("e.g.: Methadone").fill(morningMed);
    await page.getByPlaceholder("40").fill("25");
    await page.getByText("Morning", { exact: true }).click();

    const post1 = page.waitForResponse(
      (r) => r.url().includes("/api/meds") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "✓ Add" }).click();
    await post1;

    await expect(page.getByText(`Morning: ${morningMed} 25mg`)).toBeVisible();

    await page.getByRole("button", { name: "+ Add Medication" }).click();

    const noScheduleMed = `E2E No Schedule Med ${Date.now()}`;
    await page.getByPlaceholder("e.g.: Methadone").fill(noScheduleMed);
    await page.getByPlaceholder("40").fill("10");

    const post2 = page.waitForResponse(
      (r) => r.url().includes("/api/meds") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "✓ Add" }).click();
    await post2;

    await expect(
      page.getByText(`No schedule: ${noScheduleMed} 10mg`),
    ).toBeVisible();

    await expect(page.getByText(/^Noon:/)).not.toBeVisible();
    await expect(page.getByText(/^Evening:/)).not.toBeVisible();
    await expect(page.getByText(/^Night:/)).not.toBeVisible();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Backend must be running first (`cd backend && ./gradlew bootRun`), or set `PLAYWRIGHT_BASE_URL`/`PLAYWRIGHT_SKIP_WEBSERVER` per `app/playwright.config.ts`.

Run: `cd app && npx playwright test forms-crud -g "groups medications by time of day"`
Expected: FAIL — `getByText('Morning: ...')` not found (current output is still `"... — Morning"` single-line format).

- [ ] **Step 3: Commit the test change**

```bash
git add app/e2e/forms-crud.spec.ts
git commit -m "test: e2e expects grouped medication summary by time of day"
```

---

### Task 3: Implement grouped summary rendering (GREEN)

**Files:**
- Modify: `app/src/pages/MedManager.jsx:34-39` (add `summaryGroups` after `dayLabels`)
- Modify: `app/src/pages/MedManager.jsx:135-152` (replace summary rendering)

- [ ] **Step 1: Add `summaryGroups` computation after `dayLabels`**

In `app/src/pages/MedManager.jsx`, the existing `dayLabels` block (lines 34-39) reads:

```jsx
  const dayLabels = {
    morning: t('medManager.morningLabel'),
    noon: t('medManager.noonLabel'),
    evening: t('medManager.eveningLabel'),
    night: t('medManager.nightLabel'),
  };
```

Add the following immediately after it:

```jsx
  const summaryGroups = [
    { key: "morning", label: dayLabels.morning },
    { key: "noon", label: dayLabels.noon },
    { key: "evening", label: dayLabels.evening },
    { key: "night", label: dayLabels.night },
  ]
    .map((g) => ({
      label: g.label,
      meds: pMeds.filter((m) => m[g.key]),
    }))
    .concat([
      {
        label: t('medManager.noScheduleLabel'),
        meds: pMeds.filter((m) => !m.morning && !m.noon && !m.evening && !m.night),
      },
    ])
    .filter((g) => g.meds.length > 0);
```

- [ ] **Step 2: Replace the summary rendering block**

Replace lines 135-152:

```jsx
          {pMeds.length > 0 && (
            <div style={{ marginBottom: 12 }} dir={dir}>
              <div style={{ fontWeight: 700, fontSize: 11, color: C.soft, marginBottom: 4 }}>
                {t('medManager.medicationsSummaryTitle')}
              </div>
              <div style={{ background: "#f7f9fc", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: C.mid }}>
                {pMeds
                  .map((m) => {
                    const days = ["morning", "noon", "evening", "night"]
                      .filter((k) => m[k])
                      .map((k) => dayLabels[k]);
                    const schedule = days.length > 0 ? days.join(", ") : t('medManager.noScheduleSet');
                    return `${m.name} ${m.dose}${m.unit} — ${schedule}`;
                  })
                  .join("; ")}
              </div>
            </div>
          )}{" "}
```

with:

```jsx
          {pMeds.length > 0 && (
            <div style={{ marginBottom: 12 }} dir={dir}>
              <div style={{ fontWeight: 700, fontSize: 11, color: C.soft, marginBottom: 4 }}>
                {t('medManager.medicationsSummaryTitle')}
              </div>
              <div style={{ background: "#f7f9fc", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: C.mid }}>
                {summaryGroups.map((g) => (
                  <div key={g.label}>
                    {g.label}: {g.meds.map((m) => `${m.name} ${m.dose}${m.unit}`).join(", ")}
                  </div>
                ))}
              </div>
            </div>
          )}{" "}
```

- [ ] **Step 3: Run the e2e test to verify it passes**

Run: `cd app && npx playwright test forms-crud -g "groups medications by time of day"`
Expected: PASS

- [ ] **Step 4: Run the full forms-crud e2e file to check for regressions**

Run: `cd app && npx playwright test forms-crud`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add app/src/pages/MedManager.jsx
git commit -m "feat: group medication summary by time of day"
```

---

## Out of Scope (per spec)

- Showing this summary elsewhere (Dashboard, Patients card).
- Print/export of medication schedule.
- Removing the now-unused `noScheduleSet` i18n key (was only used in the
  replaced block — leave for a separate cleanup/audit).
