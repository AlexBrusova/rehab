# Vitals History Tab — Design

## Context

`PatientProfile.jsx` (`app/src/pages/PatientProfile.jsx`) shows a tabbed patient detail modal: Medications, Absences, Consequences, Finance, Moods, Therapy, Notes. The AppEn reference app shows an additional **Vitals** tab on the patient profile, displaying a history of vital-sign records (e.g. "Blood Pressure 138/90 | Pulse 80" with a date and a clinical note).

This entity does not exist in the current schema (`db/prisma/schema.prisma`) or backend. This is a new full-stack feature: new DB table, JPA entity/repo/controller, and a new frontend tab.

## Scope

- New `Vital` record type: **Blood Pressure (systolic/diastolic) + Pulse + note + date** only (matches the reference screenshot). No other vital types (temperature, weight, etc.) in this iteration.
- **Append-only history** — no edit/delete, consistent with `Finance`.
- **Add permission:** `doctor` and `therapist` only.
- **View permission:** `org_manager`, `manager`, `doctor`, `therapist`. `counselor` does not see the Vitals tab.
- `Moods` tab is untouched — Vitals is a new, separate tab.

## Data Model (`db/prisma/schema.prisma`)

New model, placed near `Finance`/`Consequence`:

```prisma
model Vital {
  id        String   @id @default(cuid())
  patientId String
  houseId   String
  systolic  Int
  diastolic Int
  pulse     Int
  note      String   @default("")
  date      String
  createdAt DateTime @default(now())
  patient   Patient  @relation(fields: [patientId], references: [id])

  @@index([patientId])
  @@index([houseId])
}
```

Add the inverse relation field on `Patient` (`vitals Vital[]`), following the existing pattern for `Finance`/`Consequence` back-references.

After editing `schema.prisma`, run `npx prisma migrate dev --name add_vital` from `db/` to generate the migration and apply it to the local dev DB.

## Backend

### `domain/Vital.kt`

JPA entity mirroring `Finance.kt`'s shape and annotations (`@Entity`, `@Table(name = "Vital")`, `@JsonIgnoreProperties(ignoreUnknown = true)`, lazy `@ManyToOne` to `Patient` with `@JsonIgnore`), fields: `id`, `patientId`, `houseId`, `systolic: Int`, `diastolic: Int`, `pulse: Int`, `note: String`, `date: String`, `createdAt: Instant`.

### `repo/VitalRepository.kt`

```kotlin
interface VitalRepository : JpaRepository<Vital, String> {
    fun findByPatientIdOrderByDateDescCreatedAtDesc(patientId: String): List<Vital>
}
```

### `web/VitalController.kt`

Mirrors `FinanceController.kt`:

- `GET /api/vitals?patientId=...` → `vitals.findByPatientIdOrderByDateDescCreatedAtDesc(patientId)`
- `POST /api/vitals` with `@Valid CreateVitalBody`, `@Transactional`, returns 201 with saved entity.

```kotlin
@JsonIgnoreProperties(ignoreUnknown = true)
data class CreateVitalBody(
    @field:NotBlank @field:Size(max = UiValidation.ID_MAX) val patientId: String? = null,
    @field:NotBlank @field:Size(max = UiValidation.ID_MAX) val houseId: String? = null,
    @field:NotNull @field:Min(0) @field:Max(300) val systolic: Int? = null,
    @field:NotNull @field:Min(0) @field:Max(300) val diastolic: Int? = null,
    @field:NotNull @field:Min(0) @field:Max(300) val pulse: Int? = null,
    @field:Size(max = UiValidation.NOTE_MAX) val note: String? = null,
    @field:NotBlank @field:Size(max = UiValidation.DATE_UI_MAX) val date: String? = null,
)
```

No role check at controller level (consistent with `MedController` — meds can also be POSTed by any authenticated role; UI gates the button).

### Flyway

`ddl-auto: validate` means Hibernate refuses to start if the entity doesn't match the DB. Add a new Flyway migration under `backend/src/main/resources/db/migration/` creating the `Vital` table with the same columns/types as the Prisma model (matching the existing baseline migration's conventions — see how `Finance`/`Consequence` tables are defined there).

## Frontend

### `App.jsx`

- Add `vitals` state (array), loaded via `authFetch('/api/vitals?patientId=...')` — follow the existing pattern used for `finance`/`consequences` (loaded per-patient or per-house, whichever the existing Finance load does — match that exactly).
- Add `onAddVital(patientId, { systolic, diastolic, pulse, note, date })` handler that POSTs to `/api/vitals` and refreshes the `vitals` list.
- Pass `vitals` and `onAddVital` down to `PatientProfile`.

### `PatientProfile.jsx`

- New prop: `vitals = []`, `onAddVital`.
- Tab list: insert `["vitals", t('patientProfile.vitalsTab')]` between `finance` and `moods`. Filter the tab array so `vitals` is omitted when `user.role === "counselor"`.
- New `{tab === "vitals" && (...)}` block:
  - `pVitals = vitals.filter(v => v.patientId === pid)` (already sorted by backend, newest first)
  - If `user.role === "doctor" || user.role === "therapist"`: show "+ Add Vitals" button (same placement/style as the Meds tab's add button) that opens an inline form with `systolic`/`diastolic`/`pulse` number inputs (`FI`) and a note `FTA`, plus Add/Cancel buttons — mirror the `showAddMed` inline-form pattern.
  - History list: if empty, show `t('patientProfile.noVitalRecords')` (same empty-state style as Finance/Consequences). Otherwise render each record as a row: `${v.systolic}/${v.diastolic} | Pulse ${v.pulse}` (bold), note below in muted text, date on the right — styled like the Finance transaction rows.
  - On add: validate systolic/diastolic/pulse are filled and within 0-300 (mirror `addMed`'s validation-then-toast pattern), call `onAddVital`, toast success/fail.

### i18n (`en.js` / `he.js`, `patientProfile` namespace)

New keys: `vitalsTab` ("Vitals" / "מדדים"), `addVitalsButton` ("+ Add Vitals"), `bloodPressureLabel` ("Blood Pressure"), `pulseLabel` ("Pulse"), `noteOptionalPlaceholder`, `noVitalRecords` ("No vital records for this patient"), `toastVitalAddSuccess`, `toastVitalAddFailed`, `toastFillVitalsRequired` (systolic/diastolic/pulse required).

## Testing

- **Backend integration test** (`backend/src/test/`, extends `AbstractIntegrationTest`): `VitalController` — create a vital record, list returns it, ordering by date desc, validation rejects out-of-range/missing fields. Target ≥80% line coverage on new backend code (entity/repo/controller).
- **Frontend**: no new unit-test infra exists for components; rely on Playwright E2E.
- **Playwright E2E** (`app/e2e/`):
  - Doctor logs in, opens a patient profile, adds a vitals record, sees it appear in the Vitals tab history.
  - Manager sees the same record in Vitals tab (read-only, no Add button).
  - Counselor does not see a Vitals tab at all.
  - Validation: submitting the add form with empty fields shows the required-field toast and does not POST.

## Out of scope

- Editing/deleting vital records.
- Additional vital types beyond BP + pulse (temperature, weight, O2 sat, etc.) — can be a follow-up if needed.
- Charting/graphing of vitals over time — history list only, per the reference screenshot.
