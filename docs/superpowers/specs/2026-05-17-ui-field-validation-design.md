# UI Field Validation — Design Spec

**Date:** 2026-05-17  
**Status:** Approved

## Goal

Show users field constraints before they make mistakes and give instant feedback when they do. Zero new dependencies.

---

## UX Behaviour (approved)

| State | Trigger | Visual |
|-------|---------|--------|
| Default | untouched | grey border, no hint |
| Focused | `onFocus` | blue border + blue hint text below |
| Error | `onBlur` when invalid | red border + `#fff8f8` bg + red error message |
| Valid (after error) | `onChange` when `touched && valid` | green border + `#f0fdf4` bg |
| Valid (after error, blur) | `onBlur` when valid | green border + `#f0fdf4` bg |

Rules:
- Error is **never** shown before first blur (doesn't interrupt typing)
- Fix is shown **immediately** on `onChange` once field has been touched — no extra blur needed
- Fields without `validate`/`hint` props behave exactly as before (backwards compatible)

---

## Architecture

### New file: `app/src/lib/fieldRules.js`

Single source of truth for all field rule objects. Each rule:

```js
{
  sanitize: (v: string) => string,   // existing — strip/clamp chars
  validate: (v: string) => string | null,  // new — null = valid, string = error message
  hint: string,                       // new — shown on focus (blue)
}
```

Exported rules (MVP scope):

| Export | Fields | Constraint summary |
|--------|--------|--------------------|
| `patientNameRules` | Patient name | Буквы и пробелы, 2–255 символов |
| `dateDdMmRules` | dob, admitDate | Формат ДД/ММ/ГГГГ |
| `medNameRules` | Medication name | 1–200 символов |
| `medDoseRules` | Dose | Число от 1 до 9999 |
| `roomNumberRules` | Room number | 1–64 символа |
| `roomBuildingRules` | Building | 1–120 символов |
| `roomCapacityRules` | Capacity | Целое число 1–50 |
| `usernameRules` | Username | Только a-z, 0-9, `.`, `_`, `-`; 1–80 символов |
| `passwordRules` | Password | 4–128 символов |
| `userFullNameRules` | Full name | 2–255 символов |

`sanitize` functions are imported from the existing `inputSanitize.js`. `validate` functions reference `V` constants from `validationLimits.js`. No duplication.

---

### Modified: `app/src/components/ui/FI.jsx`

Add two optional props and internal `touched`/`error` state:

```jsx
// New props (both optional):
// validate: (value: string) => string | null
// hint: string

// Internal state:
const [touched, setTouched] = useState(false);
const [error, setError] = useState(null);
const [focused, setFocused] = useState(false);

// onFocus: no state change (just CSS via :focus-within or inline style)
// onBlur: setTouched(true); setError(validate ? validate(value) : null)
// onChange (existing handle): if touched && validate → setError(validate(v))
```

**Border/background logic** (inline style on `<input>`):

```js
const borderColor = touched
  ? error ? C.red : C.green
  : focused ? C.blue : C.border;

const background = touched
  ? error ? '#fff8f8' : '#f0fdf4'
  : '#fff';
```

**Hint/error text** rendered below `<input>` (only when `hint` or `validate` props present):

```jsx
{(hint || validate) && (
  <div style={{ fontSize: 11, marginTop: 3, color: touched && error ? C.red : C.blue }}>
    {touched && error ? `⚠ ${error}` : focused ? hint : null}
  </div>
)}
```

`C.blue` = `#3b82f6`, `C.green` = `#22c55e`, `C.red` = `#e11d48` — add to `constants.js` if not present.

---

### Modified: 4 priority forms

Forms receive spread rule objects. Example:

```jsx
// Before:
<FI value={name} onChange={setName} sanitize={sanitizePersonName} maxLength={V.NAME_MAX} />

// After:
<FI value={name} onChange={setName} {...patientNameRules} />
```

**Forms in scope:**

| File | Fields updated |
|------|---------------|
| `Patients.jsx` (add/edit modal) | name, dob, admitDate |
| `MedManager.jsx` (add form) | medName, dose |
| `Rooms.jsx` (add modal) | number, building, capacity |
| `Manage.jsx` (add user modal) | fullName, username, password |

Forms outside scope (e.g. Groups, Therapy, Consequences) remain unchanged — no forced migration.

---

## File Change Summary

| File | Change |
|------|--------|
| `app/src/lib/fieldRules.js` | **Create** — 10 rule objects |
| `app/src/components/ui/FI.jsx` | **Extend** — +validate, +hint, +touched/error state |
| `app/src/data/constants.js` | **Extend** — add `C.blue`, `C.green` if missing |
| `app/src/pages/Patients.jsx` | **Update** — spread rules on 3 fields |
| `app/src/pages/MedManager.jsx` | **Update** — spread rules on 2 fields |
| `app/src/pages/Rooms.jsx` | **Update** — spread rules on 3 fields |
| `app/src/pages/Manage.jsx` | **Update** — spread rules on 3 fields |

---

## Out of Scope

- `FS` (FormSelect) — dropdowns don't need text validation
- `FTA` (FormTextArea) — free text, no strict format constraints
- Submit-level validation (already handled by backend 400 responses)
- Forms not in the 4 priority pages
