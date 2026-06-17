# Patient Status: Location & Editable Notes

## Problem

The Patients list shows name, admission date, and days in center, but staff
also need to see at a glance where each patient is (room / away) and a
preview of their notes. Notes are currently a dead field: collected on the
"Add Patient" form but never persisted (Patient has no `notes` column), and
the Notes tab in the patient profile is read-only.

## Scope

1. Add `notes` field to Patient (DB + JPA + API).
2. Add "Location" and "Notes" columns to the Patients table.
3. Make the Notes tab in PatientProfile editable for manager/doctor.

## Backend

### Schema
- `db/prisma/schema.prisma`: add `notes String?` to `model Patient`.
- New Flyway migration `backend/src/main/resources/db/migration/V202606110001__add_patient_notes.sql`:
  ```sql
  ALTER TABLE "Patient" ADD COLUMN "notes" TEXT;
  ```

### JPA entity (`PatientGraph.kt`)
- Add `var notes: String? = null` to `Patient`.

### `PatientController`
- `CreatePatientBody`: add optional `notes: String? = null` with
  `@field:Size(max = UiValidation.NOTE_MAX)`. Pass through to `Patient(...)`
  on create (currently silently dropped).
- PATCH `/api/patients/{id}`: add `textOrNull("notes")` branch, validate
  length ≤ `UiValidation.NOTE_MAX`, assign to `p.notes`.

## Frontend

### Patients.jsx (table)
Add two columns after "Days in Center", shown for both active and archive tabs:

- **Location**: `${room.number} – ${room.building}` or "—" if no room. If
  `p.status === "away"`, show the existing 🏠 away badge in this column
  instead of/alongside the room (room stays visible, badge appended).
- **Notes**: truncated preview (~30 chars + "…" if longer, "—" if empty).
  No inline edit — clicking the row opens the profile as today.

### PatientProfile.jsx (Notes tab)
- For manager/doctor (`canEditMeds`), show an "✏️ Edit" button next to the
  Notes block.
- Edit mode: `FTA` textarea, `sanitize={(s) => sanitizeFreeText(s, V.NOTE_MAX)}`,
  `maxLength={V.NOTE_MAX}`, with Save/Cancel buttons (pattern matches
  `EditMedRow`).
- Save calls `onUpdatePatient(pid, { notes })`, shows success/fail toast,
  exits edit mode on success.
- Other roles: existing read-only display (unchanged).

## i18n

New keys in `en.js` and `he.js`:
- `patients.tableHeaderLocation`
- `patients.tableHeaderNotes`
- `patientProfile.editNotesButton`
- `patientProfile.toastNotesUpdateSuccess`
- `patientProfile.toastNotesUpdateFailed`

(`saveButton` / `cancelButton` already exist and are reused.)

## Testing

- Backend: integration test for PATCH `/api/patients/{id}` updating `notes`,
  and create with `notes`.
- Frontend: Playwright E2E — edit notes in profile, verify table preview
  updates; verify Location column shows room/away state.
