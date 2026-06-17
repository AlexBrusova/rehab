# Medications Summary in MedManager — Design Spec

Date: 2026-06-14

## Goal

In the patient's medication card (`app/src/pages/MedManager.jsx`), add a derived text summary of **all** medications currently taken by the patient — name, dose+unit, and active times of day. Purely a UI addition based on existing `meds` data; no schema, backend, or API changes.

## Section 1: Placement & content

In `MedManager.jsx`, inside the selected-patient `Card` (`selPat && pat` block, currently starting ~line 104), insert the summary block **after** the title/"Add Medication" row (~line 128) and **before** the add-medication form (~line 130).

Only render when `pMeds.length > 0` (the existing `noMedicationsRecorded` empty state already covers the zero case, so the summary and that message are mutually exclusive).

### Content format

For each medication in `pMeds`, build a line:

```
<name> <dose><unit> — <active days, comma-joined>
```

- `<active days>`: for `["morning", "noon", "evening", "night"]` flags that are `true` on the med, map to the existing localized labels `t('medManager.morningLabel')`, `t('medManager.noonLabel')`, `t('medManager.eveningLabel')`, `t('medManager.nightLabel')`, joined with `", "`. If none of the four flags are set, show `t('medManager.noScheduleSet')` (new key, fallback text for an edge case where a med has no times assigned).
- Join multiple medication lines with `"; "` into one paragraph.

Example (EN): `Aspirin 100mg — Morning, Evening; Metformin 500mg — Morning, Night`

### Visual style

Reuse the existing "notes box" pattern seen in `PatientProfile.jsx` (light background `#f7f9fc`, `borderRadius: 8`, `padding: "9px 12px"`, `fontSize: 13`, `color: C.mid`), with a small bold label above it using `t('medManager.medicationsSummaryTitle')`. `marginBottom: 12` to separate from the form/list below. Respect `dir={dir}` on the container for RTL.

## Section 2: i18n

Add to `app/src/i18n/en.js` (`medManager` namespace, near `noMedicationsRecorded`):

```javascript
medicationsSummaryTitle: "All Medications",
noScheduleSet: "No schedule set",
```

Add corresponding keys to `app/src/i18n/he.js` in the `medManager` namespace:

```javascript
medicationsSummaryTitle: "כל התרופות",
noScheduleSet: "לא הוגדר לוח זמנים",
```

## Section 3: Testing

- `npm run lint` (app/) must pass.
- Add one Playwright E2E assertion: in `app/e2e/forms-crud.spec.ts` (or a relevant existing MedManager spec if one exists — check first), after adding a medication with at least one time slot checked in MedManager, assert the summary block contains the medication name, dose+unit, and the expected schedule label.

## Out of scope

- No changes to `PatientProfile.jsx` meds tab, `Medications.jsx` distribution screen, or any backend/schema code.
- No manually-editable "medication notes" field (rejected alternative — would require Prisma/Flyway/JPA/PATCH/i18n changes).
