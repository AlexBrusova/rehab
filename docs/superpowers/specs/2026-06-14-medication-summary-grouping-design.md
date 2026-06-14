# Medication Summary — Grouping by Time of Day

## Context

MedManager patient card already shows a one-line summary of all medications
(`app/src/pages/MedManager.jsx`, ~line 140):

```
Аспирин 100mg — Утро, Вечер; Метформин 500mg — Утро, День, Вечер
```

This is hard to scan for nurses checking "who gets what at this time slot".

## Goal

Replace the single-line summary with a per-time-slot grouped view: one line
per time slot, listing the medications taken at that slot.

## Design

### Output format

```
Утро: Аспирин 100mg, Метформин 500mg
День: Метформин 500mg
Вечер: Аспирин 100mg
Ночь: Мелатонин 3mg
Без расписания: Витамин D 1000IU
```

- Section order is fixed: morning, noon, evening, night, then "no schedule".
- Each section renders as its own line: `${label}: ${med list}`.
- Med list format per item: `${m.name} ${m.dose}${m.unit}`, joined with `, `.
- "No schedule" group = medications with all of morning/noon/evening/night
  falsy.
- A section with zero medications is omitted entirely (no empty "Ночь:" line).
- If `pMeds.length === 0`, the whole summary block is not rendered (unchanged
  from current behavior).

### Implementation

File: `app/src/pages/MedManager.jsx`

1. Keep the existing `dayLabels` map (morning/noon/evening/night →
   `t('medManager.*Label')`), already hoisted out of the render loop (commit
   7d57fc7).
2. Replace the current `.map().join("; ")` block (~lines 141-149) with:
   - Build an array of 5 group definitions: the 4 day keys + a synthetic
     `noSchedule` group.
   - For each group, filter `pMeds` to medications belonging to that group.
   - Skip groups with an empty filtered list.
   - Render each non-empty group as its own `<div>` line:
     `${label}: ${meds.map(m => \`${m.name} ${m.dose}${m.unit}\`).join(", ")}`.
3. i18n: add new key `medManager.noScheduleLabel` for the "Без расписания" /
   "No schedule" section header, in `en.js` and `he.js`. The existing
   `noScheduleSet` key (used for "no schedule set" inline phrase) is left
   as-is — different semantic, may be unused after this change but other
   call sites should be checked before removal (out of scope here).

### Testing

- Update the e2e test added in commit 721d37d
  (`app/e2e/forms-crud.spec.ts`) to assert the new grouped-line format
  instead of the old single-line format.
- Cover: a patient with meds in multiple time slots, and a patient with at
  least one medication that has no schedule set (verify "Без расписания"
  line appears and other empty slots don't).

## Out of scope

- Showing this summary elsewhere (Dashboard, Patients card).
- Print/export of medication schedule.
- Removing the now-possibly-unused `noScheduleSet` i18n key (needs separate
  audit of other usages).
