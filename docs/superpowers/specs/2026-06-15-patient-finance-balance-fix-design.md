# Patient Profile Finance Tab — Balance/History Ordering Fix

## Context

`PatientProfile.jsx` Finance tab (lines ~323-357) shows account balance and
transaction history for a patient. It computes both from `pFin`, sorted by:

```javascript
const pFin = (finance || []).filter((f) => f.patientId === pid).sort((a, b) => b.id.localeCompare(a.id));
const balance = pFin.length ? pFin[pFin.length - 1].balance ?? 0 : 0;
```

Finance transaction `id` is a random UUID (`backend/.../Finance.kt`), so
`localeCompare` on `id` gives no chronological ordering. The displayed
balance (taken from the "last" element after this meaningless sort) is
effectively a random transaction's balance snapshot, not the current
balance. The transaction history list (same `pFin`, mapped below) is also
shown in this same random order instead of newest-first.

`Finance.jsx` (the house-wide finance screen) already does this correctly:

```javascript
const pFin = finance
  .filter((f) => f.patientId === effectiveSelPat)
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
const balance = pFin.length > 0 ? pFin[0].balance : 0;
```

## Goal

Fix `PatientProfile.jsx`'s Finance tab so the displayed balance is the
current balance (from the most recent transaction) and the transaction
history is shown newest-first, matching `Finance.jsx`'s behavior.

## Design

In `app/src/pages/PatientProfile.jsx`, inside the Finance tab's IIFE
(~line 327), replace:

```javascript
const pFin = (finance || []).filter((f) => f.patientId === pid).sort((a, b) => b.id.localeCompare(a.id));
const balance = pFin.length ? pFin[pFin.length - 1].balance ?? 0 : 0;
```

with:

```javascript
const pFin = (finance || []).filter((f) => f.patientId === pid).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
const balance = pFin.length ? pFin[0].balance ?? 0 : 0;
```

No other changes to the tab — the existing balance card and transaction
list rendering (lines 331-353) consume `pFin`/`balance` unchanged and will
now display correctly: current balance at top, transactions newest-first
below.

## Testing

- New Playwright e2e test in `app/e2e/forms-crud.spec.ts` (or a finance-focused
  spec if one exists): create two finance transactions for the same patient
  via the existing Finance screen (deposit then withdrawal, or vice versa),
  open that patient's profile, switch to the Finance tab, and assert:
  - The displayed balance equals the balance after the SECOND (most recent)
    transaction.
  - The transaction list shows the most recent transaction first.

## Out of scope

- Role-based access to the Finance tab (unchanged, not part of this bug).
- Changes to `Finance.jsx` (already correct).
- Backend changes (balance field semantics are correct, only frontend
  sort/selection was wrong).
