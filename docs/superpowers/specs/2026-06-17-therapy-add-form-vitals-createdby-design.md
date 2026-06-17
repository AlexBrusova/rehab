# Therapy Session Add Form + Vitals "Added By" — Design

## Context

Two related improvements to the patient profile in `PatientProfile.jsx`:

1. **Therapy tab add form** — currently the Therapy tab is read-only. Doctors and therapists need to document new sessions directly from the patient profile without switching to the dedicated Therapy screen.
2. **Vitals "added by" tracking** — the Vitals tab (PR #28, `feat/vitals-history`) shows BP/pulse history but doesn't record who added each entry. Staff need to see which doctor or therapist logged a given reading.

Both changes ship in a single branch/PR, branched from `feat/vitals-history` (since vitals changes build on that work).

---

## Feature 1: Therapy Session Add Form

### Permissions

- **Add button visible to:** `doctor`, `therapist` only
- **View (read-only):** all roles already handled by existing tab

### Form fields

| Field | UI component | Notes |
|-------|-------------|-------|
| topic | `FI` (text) | required, max `UiValidation.TOPIC_MAX` |
| notes | `FTA` | optional, max `UiValidation.NOTE_MAX` |
| urgency | `FS` | options: NORMAL / ATTENTION / URGENT, default NORMAL |
| date | `FI` (text) | default today `dd/MM/yyyy`, editable |

`therapistId` is auto-filled from `user.id` (current logged-in user) — not shown in form. No `counselorNote` in the add form.

### Architecture

No backend changes needed — `POST /api/therapy` (legacy endpoint, already in use by the Therapy screen) accepts all required fields with optional `date`. `createTherapySession` in `App.jsx` (line ~341) already exists and handles this POST with `therapistId: user.id`.

**Changes:**
- `app/src/App.jsx` — pass `onAddSession={createTherapySession}` to `<Patients>` (alongside existing `therapy={houseTherapy}`)
- `app/src/pages/Patients.jsx` — accept `onAddSession` prop, forward to `<PatientProfile>`
- `app/src/pages/PatientProfile.jsx` — add state (`showAddSession`, `newSession`), `addSession` handler, form UI, inserted before the session history list. Mirror the Vitals add-form pattern (inline collapsible form, Add/Cancel buttons, toast on success/fail).
- `app/src/i18n/en.js` + `he.js` — new keys in `patientProfile` namespace

### New i18n keys (patientProfile namespace)

```
addSessionButton      "📝 Document Session"   /  "📝 תיעוד פגישה"
sessionTopicPlaceholder  "Topic"              /  "נושא"
sessionNotesPlaceholder  "Notes"              /  "הערות"
sessionUrgencyLabel      "Urgency"            /  "דחיפות"
urgencyNormal            "Normal"             /  "רגיל"
urgencyAttention         "Attention"          /  "תשומת לב"
urgencyUrgent            "Urgent"             /  "דחוף"
sessionDatePlaceholder   "Date (dd/mm/yyyy)"  /  "תאריך (dd/mm/yyyy)"
toastFillSessionRequired "⚠️ Topic is required"  /  "⚠️ יש להזין נושא"
toastSessionAddSuccess   "✅ Session documented"  /  "✅ הפגישה תועדה"
toastSessionAddFailed    "❌ Failed to document session"  /  "❌ נכשל תיעוד הפגישה"
```

### UX flow

1. Doctor/therapist opens patient profile → Therapy tab
2. Clicks "📝 Document Session" button (top-right, same pattern as "+ Add Vitals")
3. Inline form appears: topic, notes (textarea), urgency (select), date (pre-filled today)
4. Clicks "✓ Add" — POST fires, session prepended to list, form closes, success toast
5. If topic empty → validation toast, no POST

---

## Feature 2: Vitals — "Added By" Tracking

### Data model change

Add `createdByName` field to `Vital` (Prisma + JPA entity):

```prisma
model Vital {
  ...
  createdByName String @default("")
  ...
}
```

`createdByName` stores a human-readable string (e.g. `"Dr. Cohen"` = `user.name` from frontend at time of creation). Not a FK — avoids join overhead and survives user renames gracefully for a display field.

### Architecture

- `db/prisma/schema.prisma` — add `createdByName String @default("")` to `Vital` model
- `backend/src/main/kotlin/com/rehabcenter/domain/Vital.kt` — add `var createdByName: String = ""`
- `backend/src/main/kotlin/com/rehabcenter/web/VitalController.kt` — add optional `createdByName: String?` to `CreateVitalBody` (no `@NotBlank`, max `UiValidation.USERNAME_MAX`); include in saved entity
- `app/src/App.jsx` `createVital` handler — include `createdByName: user.name` in POST body
- `app/src/pages/PatientProfile.jsx` Vitals tab history row — show `createdByName` as muted sub-line (e.g. `Added by: Dr. Cohen`) if present
- `app/src/i18n/en.js` + `he.js` — key `addedBy: "Added by"` / `"הוסף ע"י"`

### Existing records

Old vitals records (from PR #28) will have `createdByName = ""` — the UI shows the field only `if (v.createdByName)`, so empty string = not shown. No data migration needed.

### Local migration

`ddl-auto: validate` for local `bootRun` requires: `npx prisma migrate dev --name add_vital_createdbyname` from `db/`. Docker/Railway auto-create via `ddl-auto: update`.

---

## Testing

### Backend IT (extends existing `VitalIT.kt`)

- POST with `createdByName` → stored and returned
- POST without `createdByName` → defaults to `""`, returns 201

### Playwright E2E (extends `app/e2e/vitals.spec.ts` + new `app/e2e/therapy-session.spec.ts`)

**vitals.spec.ts additions:**
- Doctor adds vitals → history row shows "Added by: [doctor name]"

**therapy-session.spec.ts (new file, 3 tests):**
1. Doctor opens Therapy tab, documents session (topic + notes + urgency + date) → appears in history
2. Form validation: submit without topic → required-field toast, no POST
3. Counselor opens Therapy tab → no "Document Session" button visible

---

## Out of scope

- Editing or deleting therapy sessions from the patient profile (existing PATCH endpoint not surfaced here)
- `counselorNote` field in the add form
- Urgency editing after creation
- Therapy session "added by" tracking (therapist name already stored via `therapistId` relation)
