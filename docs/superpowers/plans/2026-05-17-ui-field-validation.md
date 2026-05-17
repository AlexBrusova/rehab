# UI Field Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add live field validation to FI component — blue hint on focus, red error after blur, instant green on fix — across 4 priority forms.

**Architecture:** New `fieldRules.js` exports `{ sanitize, validate, hint }` objects per field type. `FI.jsx` gains optional `validate`/`hint` props with internal `touched`/`focused`/`error` state. Four forms spread rule objects onto their FI fields. Backwards compatible — FI without `validate` prop is unchanged.

**Tech Stack:** React 18, Vite, Playwright (E2E only — no unit test framework in project)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `app/src/lib/fieldRules.js` | **Create** | All `{ sanitize, validate, hint }` objects |
| `app/src/components/ui/FI.jsx` | **Modify** | Add validate/hint/touched/focused/error state |
| `app/src/pages/Patients.jsx` | **Modify** | Spread rules on name, dob, admitDate fields |
| `app/src/pages/MedManager.jsx` | **Modify** | Spread rules on medName, dose fields |
| `app/src/pages/Rooms.jsx` | **Modify** | Spread rules on building, number, capacity fields |
| `app/src/pages/Manage.jsx` | **Modify** | Spread rules on fullName, username fields |
| `app/e2e/field-validation.spec.ts` | **Create** | Playwright E2E for all 4 validation states |

---

### Task 1: Write E2E test (RED — fails until implementation complete)

**Files:**
- Create: `app/e2e/field-validation.spec.ts`

- [ ] **Step 1: Create the spec file**

```typescript
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
    if (!(await addBtn.isVisible({ timeout: 5000 }).catch(() => false))) return;
    await addBtn.click();

    const nameInput = page.getByPlaceholder("John Doe").first();
    await nameInput.waitFor({ state: "visible", timeout: 5000 });

    // State ①→②: focus shows blue hint
    await nameInput.focus();
    const hint = page.locator("div").filter({ hasText: /2.{1,5}255|буквы|символов/i }).first();
    await expect(hint).toBeVisible({ timeout: 3000 });

    // State ②→③: blur with 1 char → red error
    await nameInput.fill("А");
    await nameInput.blur();
    const errorMsg = page.locator("div").filter({ hasText: /Минимум 2/i }).first();
    await expect(errorMsg).toBeVisible({ timeout: 3000 });
    await expect(nameInput).toHaveCSS("border-color", "rgb(192, 57, 43)");

    // State ③→④: fix → immediately green (no extra blur)
    await nameInput.fill("Иванов Иван");
    await expect(nameInput).toHaveCSS("border-color", "rgb(26, 122, 74)");
  });

  test("room: building and number fields required, capacity numeric range", async ({ page }) => {
    await goToScreen(page, "rooms");
    const addBtn = page.getByRole("button", { name: /\+ Add Room/i });
    if (!(await addBtn.isVisible({ timeout: 5000 }).catch(() => false))) return;
    await addBtn.click();

    const buildingInput = page.getByPlaceholder(/Building A/i).first();
    await buildingInput.focus();
    await buildingInput.blur();
    const buildingError = page.locator("div").filter({ hasText: /корпус/i }).first();
    await expect(buildingError).toBeVisible({ timeout: 3000 });

    const capacityInput = page.getByPlaceholder("2").first();
    await capacityInput.focus();
    await capacityInput.fill("999");
    await capacityInput.blur();
    const capError = page.locator("div").filter({ hasText: /1.{1,5}50/i }).first();
    await expect(capError).toBeVisible({ timeout: 3000 });
  });

  test("meds: name and dose required", async ({ page }) => {
    await goToScreen(page, "medmanager");
    await page.waitForLoadState("networkidle");
    const patBtn = page.locator("button").filter({ hasText: /Medications/ }).first();
    if (!(await patBtn.isVisible({ timeout: 5000 }).catch(() => false))) return;
    await patBtn.click();
    const addBtn = page.getByRole("button", { name: /\+ Add Medication/i }).first();
    if (!(await addBtn.isVisible({ timeout: 5000 }).catch(() => false))) return;
    await addBtn.click();

    const nameInput = page.getByPlaceholder(/methadone|e\.g\./i).first();
    await nameInput.focus();
    await nameInput.blur();
    const nameError = page.locator("div").filter({ hasText: /название/i }).first();
    await expect(nameError).toBeVisible({ timeout: 3000 });
  });

  test("manage: username field shows hint on focus", async ({ page }) => {
    await goToScreen(page, "manage");
    await page.waitForLoadState("networkidle");
    const addBtn = page.getByRole("button", { name: /\+ (add |new )?user/i }).first();
    if (!(await addBtn.isVisible({ timeout: 5000 }).catch(() => false))) return;
    await addBtn.click();

    const usernameInput = page.getByPlaceholder(/username/i).first()
      .or(page.locator("input[autocomplete='username']").first());
    if (!(await usernameInput.isVisible({ timeout: 3000 }).catch(() => false))) return;
    await usernameInput.focus();
    const hint = page.locator("div").filter({ hasText: /a-z|логин|подчёркивание/i }).first();
    await expect(hint).toBeVisible({ timeout: 3000 });
  });
});
```

- [ ] **Step 2: Run to confirm RED**

```bash
cd app && PLAYWRIGHT_BASE_URL=http://localhost:8080 PLAYWRIGHT_SKIP_WEBSERVER=1 npx playwright test e2e/field-validation.spec.ts --reporter=line
```

Expected: all 4 tests FAIL (hints/errors not rendered yet)

---

### Task 2: Create `fieldRules.js`

**Files:**
- Create: `app/src/lib/fieldRules.js`

- [ ] **Step 1: Create the file**

```javascript
import {
  sanitizePersonName,
  sanitizeDateDdMm,
  isValidDateDdMmYyyy,
  sanitizeMedName,
  sanitizeMedDose,
  sanitizeRoomNumber,
  sanitizeRoomBuilding,
  sanitizeRoomCapacity,
  sanitizeUsername,
} from "./inputSanitize";
import { V } from "../data/validationLimits";

export const patientNameRules = {
  sanitize: sanitizePersonName,
  validate: (v) => v.trim().length < 2 ? "Минимум 2 символа" : null,
  hint: "Имя и фамилия, 2–255 символов",
};

export const dateDdMmRules = {
  sanitize: sanitizeDateDdMm,
  validate: (v) => {
    if (!v.trim()) return "Обязательное поле";
    if (!isValidDateDdMmYyyy(v.trim())) return "Формат: ДД/ММ/ГГГГ";
    return null;
  },
  hint: "Формат: ДД/ММ/ГГГГ",
};

export const dateDdMmOptionalRules = {
  sanitize: sanitizeDateDdMm,
  validate: (v) => v.trim() && !isValidDateDdMmYyyy(v.trim()) ? "Формат: ДД/ММ/ГГГГ" : null,
  hint: "Формат: ДД/ММ/ГГГГ (необязательно)",
};

export const medNameRules = {
  sanitize: sanitizeMedName,
  validate: (v) => !v.trim() ? "Введите название препарата" : null,
  hint: `Название препарата, до ${V.MED_NAME_MAX} символов`,
};

export const medDoseRules = {
  sanitize: sanitizeMedDose,
  validate: (v) => !v.trim() ? "Введите дозу" : null,
  hint: "Доза и единица (напр. 40 мг)",
};

export const roomNumberRules = {
  sanitize: sanitizeRoomNumber,
  validate: (v) => !v.trim() ? "Введите номер комнаты" : null,
  hint: `Номер комнаты, до ${V.ROOM_NUMBER_MAX} символов`,
};

export const roomBuildingRules = {
  sanitize: sanitizeRoomBuilding,
  validate: (v) => !v.trim() ? "Введите название корпуса" : null,
  hint: `Корпус, до ${V.ROOM_BUILDING_MAX} символов`,
};

export const roomCapacityRules = {
  sanitize: sanitizeRoomCapacity,
  validate: (v) => {
    const n = parseInt(v, 10);
    if (Number.isNaN(n) || n < V.ROOM_CAPACITY_MIN || n > V.ROOM_CAPACITY_MAX) {
      return `Число от ${V.ROOM_CAPACITY_MIN} до ${V.ROOM_CAPACITY_MAX}`;
    }
    return null;
  },
  hint: `Вместимость: ${V.ROOM_CAPACITY_MIN}–${V.ROOM_CAPACITY_MAX} пациентов`,
};

export const usernameRules = {
  sanitize: sanitizeUsername,
  validate: (v) => !v.trim() ? "Введите логин" : null,
  hint: "Только a-z, 0-9, точка, дефис, подчёркивание",
};

export const userFullNameRules = {
  sanitize: sanitizePersonName,
  validate: (v) => v.trim().length < 2 ? "Минимум 2 символа" : null,
  hint: "Имя и фамилия, 2–255 символов",
};
```

- [ ] **Step 2: Verify no import errors**

```bash
cd app && npm run lint -- --quiet 2>&1 | grep fieldRules
```

Expected: no output (no lint errors)

- [ ] **Step 3: Commit**

```bash
git add app/src/lib/fieldRules.js
git commit -m "feat(validation): add fieldRules.js with validate+hint per field type"
```

---

### Task 3: Extend `FI.jsx`

**Files:**
- Modify: `app/src/components/ui/FI.jsx`

- [ ] **Step 1: Replace the file contents**

```jsx
import { useState } from "react";
import { C } from "../../data/constants";

/**
 * Controlled text input. Optional props:
 *   validate(v) → string|null  — null = valid, string = error message shown after blur
 *   hint: string               — shown in blue while field is focused
 * Without validate/hint, behaves exactly as before (backwards compatible).
 */
export default function FI({
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
  sanitize,
  validate,
  hint,
  title,
  ...rest
}) {
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState(null);

  const handle = (e) => {
    let v = e.target.value;
    if (sanitize) v = sanitize(v);
    if (maxLength != null) v = String(v).slice(0, maxLength);
    onChange(v);
    if (touched && validate) setError(validate(v));
  };

  const handleFocus = () => setFocused(true);

  const handleBlur = () => {
    setFocused(false);
    setTouched(true);
    if (validate) setError(validate(value));
  };

  const hasValidation = !!validate;
  const borderColor = hasValidation && touched
    ? error ? C.red : C.green
    : focused ? C.blue : C.border;
  const background = hasValidation && touched
    ? error ? "#fce8e8" : "#e8f8ef"
    : "#fff";

  return (
    <div>
      <input
        type={type}
        value={value}
        maxLength={maxLength ?? undefined}
        onChange={handle}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder || ""}
        title={title}
        style={{
          width: "100%",
          padding: "8px 12px",
          border: `1.5px solid ${borderColor}`,
          borderRadius: 8,
          fontSize: 13,
          fontFamily: "inherit",
          direction: "ltr",
          boxSizing: "border-box",
          background,
          transition: "border-color 0.15s, background 0.15s",
        }}
        {...rest}
      />
      {hasValidation && (touched || focused) && (
        <div
          style={{
            fontSize: 11,
            marginTop: 3,
            color: touched && error ? C.red : C.blue,
            minHeight: 16,
          }}
        >
          {touched && error ? `⚠ ${error}` : focused && hint ? hint : null}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify lint passes**

```bash
cd app && npm run lint -- --quiet 2>&1 | grep FI
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add app/src/components/ui/FI.jsx
git commit -m "feat(validation): extend FI with validate/hint/touched/focused state"
```

---

### Task 4: Apply rules to `Patients.jsx`

**Files:**
- Modify: `app/src/pages/Patients.jsx`

- [ ] **Step 1: Add import at top of file** (after existing imports)

Find the line:
```js
import {
  sanitizePersonName,
  sanitizeNationalIdDigits,
  sanitizeDateDdMm,
```

Replace the entire sanitize import block with:
```js
import {
  sanitizeNationalIdDigits,
  sanitizeFreeText,
} from "../lib/inputSanitize";
import {
  patientNameRules,
  dateDdMmRules,
  dateDdMmOptionalRules,
} from "../lib/fieldRules";
```

- [ ] **Step 2: Update name field** (~line 121)

Find:
```jsx
<FI
  value={newP.name}
  onChange={(v) => setNewP((p) => ({ ...p, name: v }))}
  sanitize={sanitizePersonName}
```

(The line after has `maxLength` or `placeholder`. Include through the closing `/>` or next prop end.)

Replace with:
```jsx
<FI
  value={newP.name}
  onChange={(v) => setNewP((p) => ({ ...p, name: v }))}
  {...patientNameRules}
```

- [ ] **Step 3: Update dob field** (~line 142)

Find:
```jsx
<FI
  value={newP.dob}
  onChange={(v) => setNewP((p) => ({ ...p, dob: v }))}
  sanitize={sanitizeDateDdMm}
```

Replace with:
```jsx
<FI
  value={newP.dob}
  onChange={(v) => setNewP((p) => ({ ...p, dob: v }))}
  {...dateDdMmRules}
```

- [ ] **Step 4: Update admitDate field** (~line 153)

Find:
```jsx
<FI
  value={newP.admitDate}
  onChange={(v) => setNewP((p) => ({ ...p, admitDate: v }))}
  sanitize={sanitizeDateDdMm}
```

Replace with:
```jsx
<FI
  value={newP.admitDate}
  onChange={(v) => setNewP((p) => ({ ...p, admitDate: v }))}
  {...dateDdMmOptionalRules}
```

- [ ] **Step 5: Verify no unused import warnings**

```bash
cd app && npm run lint -- --quiet 2>&1 | grep -i "patients\|unused"
```

Expected: no output

- [ ] **Step 6: Commit**

```bash
git add app/src/pages/Patients.jsx
git commit -m "feat(validation): apply field rules to Patients add form"
```

---

### Task 5: Apply rules to `MedManager.jsx`

**Files:**
- Modify: `app/src/pages/MedManager.jsx`

- [ ] **Step 1: Add import** (after existing imports near top)

Find the existing sanitize import line (e.g. `import { sanitizeMedName, sanitizeMedDose } from ...`) and replace with:

```js
import { medNameRules, medDoseRules } from "../lib/fieldRules";
```

- [ ] **Step 2: Update medName field** (~line 170)

Find:
```jsx
<FI
  value={newMed.name}
  onChange={(v) => setNewMed((m) => ({ ...m, name: v }))}
  placeholder="e.g.: Methadone"
  sanitize={sanitizeMedName}
```

Replace with:
```jsx
<FI
  value={newMed.name}
  onChange={(v) => setNewMed((m) => ({ ...m, name: v }))}
  placeholder="e.g.: Methadone"
  {...medNameRules}
```

- [ ] **Step 3: Update dose field** (~line 190)

Find:
```jsx
<FI
  value={newMed.dose}
  onChange={(v) => setNewMed((m) => ({ ...m, dose: v }))}
  placeholder="40"
  sanitize={sanitizeMedDose}
```

Replace with:
```jsx
<FI
  value={newMed.dose}
  onChange={(v) => setNewMed((m) => ({ ...m, dose: v }))}
  placeholder="40"
  {...medDoseRules}
```

- [ ] **Step 4: Lint check**

```bash
cd app && npm run lint -- --quiet 2>&1 | grep MedManager
```

Expected: no output

- [ ] **Step 5: Commit**

```bash
git add app/src/pages/MedManager.jsx
git commit -m "feat(validation): apply field rules to MedManager add form"
```

---

### Task 6: Apply rules to `Rooms.jsx`

**Files:**
- Modify: `app/src/pages/Rooms.jsx`

- [ ] **Step 1: Add import** (replace existing sanitize imports for room fields)

Find the lines importing `sanitizeRoomBuilding`, `sanitizeRoomCapacity`, `sanitizeRoomNumber` from inputSanitize, replace with:

```js
import { roomNumberRules, roomBuildingRules, roomCapacityRules } from "../lib/fieldRules";
```

- [ ] **Step 2: Update building field** (in add modal, ~line 556)

Find:
```jsx
<FI
  value={newR.building}
  onChange={(v) => setNewR((r) => ({ ...r, building: v }))}
  placeholder="Building A"
  sanitize={sanitizeRoomBuilding}
  maxLength={V.ROOM_BUILDING_MAX}
```

Replace with:
```jsx
<FI
  value={newR.building}
  onChange={(v) => setNewR((r) => ({ ...r, building: v }))}
  placeholder="Building A"
  {...roomBuildingRules}
```

- [ ] **Step 3: Update room number field** (~line 565)

Find:
```jsx
<FI
  value={newR.number}
  onChange={(v) => setNewR((r) => ({ ...r, number: v }))}
  placeholder="Room 5"
  sanitize={sanitizeRoomNumber}
  maxLength={V.ROOM_NUMBER_MAX}
```

Replace with:
```jsx
<FI
  value={newR.number}
  onChange={(v) => setNewR((r) => ({ ...r, number: v }))}
  placeholder="Room 5"
  {...roomNumberRules}
```

- [ ] **Step 4: Update capacity field** (~line 574)

Find:
```jsx
<FI
  value={newR.capacity}
  onChange={(v) => setNewR((r) => ({ ...r, capacity: v }))}
  placeholder="2"
  sanitize={sanitizeRoomCapacity}
  maxLength={2}
  inputMode="numeric"
```

Replace with:
```jsx
<FI
  value={newR.capacity}
  onChange={(v) => setNewR((r) => ({ ...r, capacity: v }))}
  placeholder="2"
  inputMode="numeric"
  {...roomCapacityRules}
```

- [ ] **Step 5: Lint check**

```bash
cd app && npm run lint -- --quiet 2>&1 | grep Rooms
```

Expected: no output

- [ ] **Step 6: Commit**

```bash
git add app/src/pages/Rooms.jsx
git commit -m "feat(validation): apply field rules to Rooms add modal"
```

---

### Task 7: Apply rules to `Manage.jsx`

**Files:**
- Modify: `app/src/pages/Manage.jsx`

- [ ] **Step 1: Add import** (after existing sanitize imports)

Find the line importing `sanitizePersonName`, `sanitizeUsername` from inputSanitize. Replace those two with:

```js
import { userFullNameRules, usernameRules } from "../lib/fieldRules";
```

Keep any remaining sanitize imports (e.g. `sanitizePhoneInput`) untouched.

- [ ] **Step 2: Update name field in add user form** (~line 122)

Find:
```jsx
<FI
  value={newU.name}
  onChange={(v) => setNewU((u) => ({ ...u, name: v }))}
```

(followed by `sanitize={sanitizePersonName}`)

Replace the `sanitize={sanitizePersonName}` line with `{...userFullNameRules}`:
```jsx
<FI
  value={newU.name}
  onChange={(v) => setNewU((u) => ({ ...u, name: v }))}
  {...userFullNameRules}
```

- [ ] **Step 3: Update username field** (~line 131)

Find:
```jsx
<FI
  value={newU.username}
  onChange={(v) => setNewU((u) => ({ ...u, username: v }))}
```

(followed by `sanitize={sanitizeUsername}`)

Replace:
```jsx
<FI
  value={newU.username}
  onChange={(v) => setNewU((u) => ({ ...u, username: v }))}
  {...usernameRules}
```

- [ ] **Step 4: Lint check**

```bash
cd app && npm run lint -- --quiet 2>&1 | grep Manage
```

Expected: no output

- [ ] **Step 5: Commit**

```bash
git add app/src/pages/Manage.jsx
git commit -m "feat(validation): apply field rules to Manage add user form"
```

---

### Task 8: Run E2E tests (GREEN)

- [ ] **Step 1: Run validation spec**

```bash
cd app && PLAYWRIGHT_BASE_URL=http://localhost:8080 PLAYWRIGHT_SKIP_WEBSERVER=1 npx playwright test e2e/field-validation.spec.ts --reporter=line
```

Expected: all 4 tests PASS

- [ ] **Step 2: Run full suite — no regressions**

```bash
cd /path/to/repo && make e2e 2>&1 | tail -5
```

Expected: `101 passed` (or 105 with new tests)

- [ ] **Step 3: Commit E2E spec**

```bash
git add app/e2e/field-validation.spec.ts
git commit -m "test(e2e): add field-validation spec for FI states"
```

---

### Task 9: PR

- [ ] **Step 1: Push branch and open PR**

```bash
git push origin fix/th-text-align
gh pr create --title "feat(validation): live field validation with hints in FI component" --body "$(cat <<'EOF'
## Summary
- New `fieldRules.js`: 10 rule objects with `{ sanitize, validate, hint }` per field type
- `FI.jsx`: blue hint on focus, red error after blur, green on fix — backwards compatible
- Applied to: Patients (name, dob, admitDate), MedManager (name, dose), Rooms (building, number, capacity), Manage (name, username)

## Test plan
- [ ] Playwright `field-validation.spec.ts` — 4 tests green
- [ ] Full `make e2e` — no regressions (101+ pass)
- [ ] Manual: open Patients add form → focus name → see blue hint → blur empty → see red → fix → see green
EOF
)"
```

Expected: PR URL printed

---

## Self-Review

**Spec coverage:**
- ✅ Style C (green/red borders + background) — Task 3 FI.jsx
- ✅ Timing C (error after blur, fix immediately) — Task 3 `handleBlur`/`handle` logic
- ✅ Hint C (blue on focus, error on blur) — Task 3 hint div
- ✅ fieldRules.js single source — Task 2
- ✅ 4 forms in scope — Tasks 4-7
- ✅ Backwards compatible — `hasValidation = !!validate` guard in Task 3

**Placeholder scan:** No TBD, no "implement later", all code blocks complete.

**Type consistency:**
- `validate: (v: string) => string | null` — consistent across fieldRules.js (Task 2) and FI.jsx usage (Task 3)
- `{...patientNameRules}` spreads `{ sanitize, validate, hint }` — all three props accepted by new FI ✅
- `sanitize` prop still accepted by FI (unchanged) — rules that include it work correctly ✅
- `maxLength` explicitly removed from Rooms fields where `sanitizeRoomCapacity` already clamps — no conflict ✅
