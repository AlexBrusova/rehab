# Patient Profile — Consequences Summary Badge

## Context

`PatientProfile.jsx` header (lines 131-164) shows quick-glance badges for a
patient: medications count (`💊 N medications`) and active/away status.
Consequences (phone/visit/cigarette restrictions etc.) are only visible by
clicking into the "Consequences" tab (lines 289-310). Staff want to see at a
glance, from the header, whether a patient has any active or pending
consequences without opening the tab.

## Goal

Add a "Consequences" summary to the patient profile header: a count badge
plus a list of the affected restriction types, shown only when the patient
has at least one pending or approved consequence.

## Design

### Data

In `PatientProfile.jsx`, alongside the existing `pCons` filter (currently
inline inside the Consequences tab, line 293), compute:

```javascript
const pActiveCons = (consequences || []).filter(
  (c) => c.patientId === pid && (c.status === "pending" || c.status === "approved")
);
```

Rejected/cancelled consequences (any other status) are excluded — they're
not currently in effect.

### Type labels

`typeLabels` (phone/visit/cigarettes/other → emoji + label) is currently
defined inline inside the Consequences tab (line 294). Hoist it to a
component-level constant (same pattern as `dayLabels` for medications,
commit 7d57fc7) so both the tab and the new summary use the same mapping.

### Header badge

In the badges row (line 141-146), after the existing meds badge, add:

```jsx
{pActiveCons.length > 0 && (
  <Badge type="orange">⛔ {pActiveCons.length} {t('patientProfile.consequencesLabel')}</Badge>
)}
```

Only rendered when `pActiveCons.length > 0` — no badge for patients with no
active consequences (consistent with "section omitted when empty" pattern
used in the medication summary).

### Type list line

Below the badges row (after line 146, still inside the header's flex
column), when `pActiveCons.length > 0`, render a small text line listing the
distinct types involved, comma-separated:

```jsx
{pActiveCons.length > 0 && (
  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
    {[...new Set(pActiveCons.map((c) => typeLabels[c.type] || c.type))].join(", ")}
  </div>
)}
```

Example output: `📵 Phone Restriction, 🚬 Cigarette Restriction`.

### i18n

Add `patientProfile.consequencesLabel` = `"Consequences"` (en) /
corresponding Hebrew translation in `he.js`, following the existing
`patientProfile.*` key pattern.

### Out of scope

- Badge is not clickable (no tab-switch on click) — opening the
  Consequences tab manually is unchanged.
- No changes to the Consequences tab itself beyond extracting `typeLabels`
  to a shared constant.
- No changes to backend/API.

## Testing

- Update/extend the i18n parity test (`app/src/i18n/i18n.test.js`) — should
  pass automatically once both `en.js` and `he.js` get the new key.
- New Playwright e2e test in `app/e2e/forms-crud.spec.ts`: propose a
  consequence for a patient (existing "Consequences: propose with patient
  and description" test already does this), then navigate to that patient's
  profile and assert the `⛔ 1 Consequences` badge and type line are visible.
