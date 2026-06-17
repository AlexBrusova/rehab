# Patient Profile Details — Design Spec

Date: 2026-06-11

## Goal

Patient profile currently shows read-only demographics (name, DOB, admit date, room, days in rehab). Add 5 more fields, all editable post-creation by manager/doctor:

1. `idNum` — ID/passport number. Already collected on the create-patient form (`app/src/pages/Patients.jsx`) but silently dropped server-side (`CreatePatientBody` doesn't declare it, `@JsonIgnoreProperties(ignoreUnknown = true)` swallows it).
2. `addiction` — addiction type. Same situation as `idNum`: collected on create form, dropped server-side.
3. `phone` — patient's own contact phone. New field, profile-only (not on create form).
4. `emergencyContactName` — new field, profile-only.
5. `emergencyContactPhone` — new field, profile-only, separate from `emergencyContactName` (two columns, not one combined string).

## Section 1: Schema & Backend

### Prisma (`db/prisma/schema.prisma`)

Add to `model Patient` (after existing `awayType` field, before relations):

```prisma
idNum                 String?
addiction             String?
phone                 String?
emergencyContactName  String?
emergencyContactPhone String?
```

All nullable `String?`, no defaults — matches existing optional-text fields like `dischargeType`.

### Flyway migration

New file `backend/src/main/resources/db/migration/V202606120001__add_patient_profile_details.sql`:

```sql
ALTER TABLE "Patient"
  ADD COLUMN "idNum" TEXT,
  ADD COLUMN "addiction" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "emergencyContactName" TEXT,
  ADD COLUMN "emergencyContactPhone" TEXT;
```

(Filename date `V202606120001` continues from the latest existing migration `V202605250002`, dated 2026-06-12 to avoid any collision with PR #24's pending `V202606110001__add_patient_notes.sql` on its unmerged branch — both can apply cleanly regardless of merge order since they touch different columns.)

### JPA entity (`backend/src/main/kotlin/com/rehabcenter/domain/PatientGraph.kt`)

Add 5 new `var ... : String? = null` properties to `class Patient`, alongside `awayType`/`dischargeType`/`dischargeDate` (same style, no `@Column` annotation needed since nullable columns don't require one):

```kotlin
var idNum: String? = null,
var addiction: String? = null,
var phone: String? = null,
var emergencyContactName: String? = null,
var emergencyContactPhone: String? = null,
```

### `CreatePatientBody` / `create()` (`PatientController.kt`)

Add two optional fields to `CreatePatientBody`, validated with `UiValidation.SHORT_LABEL` (120 chars), matching the existing pattern for other optional `String?` body fields:

```kotlin
@field:Size(max = UiValidation.SHORT_LABEL, message = "ID number is too long")
val idNum: String? = null,
@field:Size(max = UiValidation.SHORT_LABEL, message = "Addiction type is too long")
val addiction: String? = null,
```

In `create()`, pass through to the new `Patient(...)` constructor call: `idNum = body.idNum`, `addiction = body.addiction`. `phone`/`emergencyContactName`/`emergencyContactPhone` are NOT added to `CreatePatientBody` — profile-only, set via PATCH after creation.

### PATCH (`patch()` in `PatientController.kt`)

Add 5 `textOrNull(...)` blocks following the existing `dischargeType`/`notes`-style pattern, each validated against `UiValidation.SHORT_LABEL`:

```kotlin
textOrNull("idNum")?.let { idNum ->
    if (idNum.length > UiValidation.SHORT_LABEL) {
        throw ResponseStatusException(HttpStatus.BAD_REQUEST, "ID number is too long")
    }
    p.idNum = idNum
}
textOrNull("addiction")?.let { addiction ->
    if (addiction.length > UiValidation.SHORT_LABEL) {
        throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Addiction type is too long")
    }
    p.addiction = addiction
}
textOrNull("phone")?.let { phone ->
    if (phone.length > UiValidation.SHORT_LABEL) {
        throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Phone is too long")
    }
    p.phone = phone
}
textOrNull("emergencyContactName")?.let { name ->
    if (name.length > UiValidation.SHORT_LABEL) {
        throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Emergency contact name is too long")
    }
    p.emergencyContactName = name
}
textOrNull("emergencyContactPhone")?.let { phone ->
    if (phone.length > UiValidation.SHORT_LABEL) {
        throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Emergency contact phone is too long")
    }
    p.emergencyContactPhone = phone
}
```

`textOrNull` already supports clearing a field by sending an empty string (existing helper behavior) — same semantics apply to all 5 new fields.

### Backend tests (`PatientsIT.kt`)

- Extend the create test to assert `idNum`/`addiction` round-trip from `CreatePatientBody` into the persisted/returned `Patient`.
- Add PATCH tests: update all 5 new fields in one request and assert they're persisted; update with an over-limit value (>120 chars) for one field and assert `400 Bad Request`.

## Section 2: Frontend UI

### `PatientProfile.jsx` — Notes tab, "Patient Details" card

The existing `patientDetailsTitle` Card (lines ~403-423) currently renders read-only rows (name, DOB, admit date, room, days) plus a conditional `p.notes` block. Add a single **"Edit Details"** block below/within this card:

- **Display mode** (default): render 5 new rows in the same `[label, value]` row style as the existing demographics, showing `—` for empty/null values:
  - ID number (`idNum`)
  - Addiction type (`addiction`)
  - Phone (`phone`)
  - Emergency contact name (`emergencyContactName`)
  - Emergency contact phone (`emergencyContactPhone`)
- One **"Edit Details"** `Btn`, visible only when `canEditMeds` is true, placed in the card header area (next to `CT`).
- **Edit mode**: clicking "Edit Details" replaces the 5 display rows with 5 `FI` (FormInput) fields, each pre-filled with current values. A single **"Save"** `Btn` and a **"Cancel"** `Btn` appear below the inputs.
  - `idNum` input: reuse `sanitizeNationalIdDigits`, `maxLength={9}`, `inputMode="numeric"` — same constraints as the create-form's ID field.
  - `addiction`, `phone`, `emergencyContactName`, `emergencyContactPhone`: each uses `sanitizeFreeText(value, V.SHORT_LABEL)`, no special `inputMode`.
- **Save** sends one `PATCH /api/patients/:id` via `updatePatient(id, {...})` containing all 5 fields (even unchanged ones — simplest, matches single-PATCH-call requirement). On success, exit edit mode and show a toast (`toastDetailsUpdateSuccess`); on failure, keep edit mode open and show an error toast (`toastDetailsUpdateFailed`) using `readApiErrorMessage`.
- **Cancel** discards the draft and returns to display mode without calling the API.
- State: one `editingDetails` boolean and one `detailsDraft` object (`{ idNum, addiction, phone, emergencyContactName, emergencyContactPhone }`), following the same `editingNotes`/`notesDraft` naming convention used for the notes feature.

### Patients list / create form

No changes to `Patients.jsx` create form — `idNum` and `addiction` inputs already exist and already get spread into the create POST payload (`App.jsx`'s `createPatient`); only the backend wiring (Section 1) is needed for these two to persist. `phone`/`emergencyContactName`/`emergencyContactPhone` are not added to the create form (profile-only, per scope).

No changes to the Patients list table — these 5 fields are profile-detail-only, not list columns.

## Section 3: i18n & Testing

### i18n keys

Add to `app/src/i18n/en.js` and `app/src/i18n/he.js`, namespace `patientProfile` (preserve each file's existing formatting style — multi-line for `en.js`, single-line per-namespace for `he.js`):

- `idNumberLabel`, `addictionTypeLabel` — new `patientProfile`-scoped keys (the existing `patients.idNumberLabel`/`patients.addictionTypeLabel` are in a different namespace for the create form; values can match wording but keys are duplicated per existing per-namespace i18n convention).
- `phoneLabel`
- `emergencyContactNameLabel`
- `emergencyContactPhoneLabel`
- `editDetailsButton`
- `toastDetailsUpdateSuccess`
- `toastDetailsUpdateFailed`

Save/Cancel buttons reuse existing `common.saveButton` / `common.cancelButton` — no new keys needed.

### Backend tests

- `PatientsIT.kt`: as described in Section 1 — create with `idNum`/`addiction`, PATCH all 5 new fields, PATCH validation failure (over-length) for at least one field.

### Frontend

- `npm run lint` must pass (ESLint).
- Playwright E2E (`app/e2e/forms-crud.spec.ts`): new test "Patients: edit profile details (ID, addiction, phone, emergency contact)" — open a patient profile as manager, click "Edit Details", fill all 5 fields, save, verify the values render in display mode after save and persist after closing/reopening the profile.

## Out of Scope

- No changes to Patients list table columns.
- No changes to the create-patient form beyond what already exists (no new create-time fields for `phone`/emergency contact).
- Does not depend on or modify the unmerged `notes` feature (PR #24) — both touch the same Notes-tab card but add independent, non-overlapping blocks. Potential merge conflict between the two branches is expected and resolved at merge time, not addressed by this spec.
