# Frontend-Backend Audit

**Date:** 2026-05-17
**Status legend:** ✅ Match | ❌ Mismatch (breaks functionality) | ⚠️ Risk (partial mismatch)

## Endpoint Matrix

| # | Module | Endpoint | Method | Frontend sends | Backend expects | Status | Notes |
|---|--------|----------|--------|----------------|-----------------|--------|-------|
| 1 | Auth | /api/auth/login | POST | `{ username, password }` | `{ username(@NotBlank), password(@NotBlank) }` | ✅ | |
| 2 | Houses | /api/houses | GET | — | — | ✅ | |
| 3 | Users | /api/users | GET | — | — | ✅ | |
| 4 | Users | /api/users | POST | `{ name, username, role, roleLabel, initials, password, ...formData }` | `{ name(@NotBlank), username(@NotBlank), role(@NotBlank), roleLabel(@NotBlank), initials?, color?, phone?, allHousesAccess?, houseId?, password? }` | ✅ | Frontend computes `initials` and `roleLabel` before sending |
| 5 | Users | /api/users/{id} | PATCH | `{ name?, username?, role?, roleLabel?, initials?, password? }` | All fields optional | ✅ | |
| 6 | Patients | /api/patients?houseId=X | GET | `houseId` param | `houseId` (optional) | ✅ | |
| 7 | Patients | /api/patients/archived?houseId=X | GET | `houseId` param | `houseId` (@NotBlank) | ✅ | |
| 8 | Patients | /api/patients | POST | `{ name, dob, admitDate, houseId, roomId? }` | `{ name(@NotBlank), dob(@NotBlank), admitDate(@NotBlank), houseId(@NotBlank), roomId? }` | ✅ | Frontend form field is `dob` — matches backend DTO field `dob`. Task spec incorrectly listed `dateOfBirth`. |
| 9 | Patients | /api/patients/{id} | PATCH | `{ name?, dob?, admitDate?, roomId?, mood?, awayType?, alert?, status?, dischargeType?, dischargeDate? }` | Accepts free JsonNode, validates inline: name, dob, admitDate, roomId, mood(0-10), alert(bool), status(active\|archived), dischargeType, dischargeDate, daysInRehab, awayType | ✅ | Frontend never sends `daysInRehab` but backend handles absence gracefully |
| 10 | Rooms | /api/rooms?houseId=X | GET | `houseId` param | `houseId` (optional) | ✅ | |
| 11 | Rooms | /api/rooms | POST | `{ number, building, capacity, houseId }` | `{ number(@NotBlank), building(@NotBlank), capacity?, houseId(@NotBlank) }` | ✅ | |
| 12 | Rooms | /api/rooms/{id} | PATCH | `{ number?, building?, capacity? }` | All optional | ✅ | |
| 13 | Rooms | /api/rooms/{id} | DELETE | — | — | ✅ | |
| 14 | Meds | /api/meds | POST | `{ patientId, name, dose, unit, times: string[], startDate?, endDate?, notes? }` | `{ patientId(@NotBlank), name(@NotBlank), dose(@NotBlank), unit?, times?, prescribedBy?, startDate?, endDate?, notes? }` | ⚠️ | Frontend never sends `prescribedBy`; backend field is `prescribedBy` (optional). Task spec listed `prescriber` — that field does not exist in the backend DTO. Frontend omits `prescribedBy` entirely — saved as null, not a 400. |
| 15 | Meds | /api/meds/{id} | PATCH | `{ name?, dose?, unit?, times? }` | `{ name?, dose?, unit?, times?, startDate?, endDate?, prescribedBy?, notes? }` | ⚠️ | EditMedRow only edits name/dose/unit/times. `startDate`, `endDate`, `prescribedBy`, `notes` cannot be edited from the UI — data loss risk on update. |
| 16 | Meds | /api/meds/{id} | DELETE | — | — | ✅ | |
| 17 | Distributions | /api/distributions?houseId=X&date=X | GET | `houseId`, `date` params | `houseId`(@NotBlank), `date`(@NotBlank) | ✅ | |
| 18 | Distributions | /api/distributions | PUT | `{ patientId, shift, date, status }` | `{ patientId(@NotBlank), shift(@NotBlank), date(@NotBlank), status? }` | ✅ | Backend is ShiftDistributionController at `/api/distributions` |
| 19 | Shifts | /api/shifts?houseId=X | GET | `houseId` param | `houseId?`, `date?` (both optional) | ✅ | |
| 20 | Shifts | /api/shifts | POST | `{ date, shift?, note?, receivedFrom?, start?, houseId, counselorId }` | `{ houseId(@NotBlank), counselorId(@NotBlank), date(@NotBlank), shift?, note?, receivedFrom?, start? }` | ✅ | Frontend spreads `data` + adds `houseId` and `counselorId` from app state |
| 21 | Shifts | /api/shifts/{id} | PATCH | `{ status?, end?, handedTo?, note? }` | `{ status?, note?, receivedFrom?, handedTo?, accepted?, start?, end? }` | ✅ | Frontend does not send `accepted` or `start` on patch — optional, no issue |
| 22 | Phones | /api/phones?houseId=X | GET | `houseId` param | `houseId` (optional) | ✅ | |
| 23 | Phones | /api/phones | POST | `{ patientId, givenAt, returnBy }` | `{ patientId(@NotBlank), givenAt(@NotBlank, HH:mm), returnBy(@NotBlank, HH:mm) }` | ✅ | Frontend passes HH:mm strings from `toTimeString().slice(0,5)` |
| 24 | Phones | /api/phones/{id} | PATCH | `{ status: "returned", returnedAt, late }` | `{ status?(pattern), returnedAt?(HH:mm), late?(bool) }` | ✅ | |
| 25 | Consequences | /api/consequences?houseId=X | GET | `houseId` param | `houseId` (optional) | ✅ | |
| 26 | Consequences | /api/consequences | POST | `{ patientId, type, description, houseId, date }` | `{ patientId(@NotBlank), houseId(@NotBlank), type(@NotBlank), description(@NotBlank), date(@NotBlank) }` | ✅ | Task spec incorrectly listed `note`; actual frontend sends `description` which matches backend DTO field. |
| 27 | Consequences | /api/consequences/{id} | PATCH | `{ status?, approvedBy? }` | `{ status?(pattern), approvedBy? }` | ✅ | |
| 28 | Finance/Patient | /api/finance/patient?houseId=X | GET | `houseId` param | `houseId`(@NotBlank) | ✅ | |
| 29 | Finance/Patient | /api/finance/patient | POST | `{ patientId, type, amount, cat, note, date, balance }` | `{ patientId(@NotBlank), type(@NotBlank pattern), amount, source(alias: cat), note?, date(@NotBlank), balance }` | ✅ | Backend uses `@JsonAlias("cat")` so frontend `cat` maps to `source`. `amount` and `balance` are required (@Min/@Max but not @NotNull — null will cause NPE on save via `body.amount!!`) |
| 30 | Finance/Cashbox | /api/finance/cashbox?houseId=X | GET | `houseId` param | `houseId`(@NotBlank) | ✅ | Handled by FinanceCashboxProxyController |
| 31 | Finance/Cashbox | /api/finance/cashbox | POST | `{ houseId, type, amount, cat, note, date, time, by: user.name, balance }` | `{ houseId(@NotBlank), type(@NotBlank), amount, cat?, note?, date(@NotBlank), time(@NotBlank, HH:mm), byStaff(@NotBlank via @JsonProperty("by")), balance }` | ✅ | Frontend sends `by` which backend maps to `byStaff` via `@JsonProperty("by")` |
| 32 | Finance/Cashbox-counts | /api/finance/cashbox-counts?houseId=X | GET | `houseId` param | `houseId`(@NotBlank) | ✅ | |
| 33 | Finance/Cashbox-counts | /api/finance/cashbox-counts | POST | `{ houseId, countedBy, amount, expected, diff, date, time, notes }` | `{ houseId(@NotBlank), countedBy(@NotBlank), amount, expected, diff, date(@NotBlank), time(@NotBlank, HH:mm), notes? }` | ✅ | |
| 34 | Groups | /api/groups?houseId=X | GET | `houseId` param | `houseId`(@NotBlank), `date?` | ✅ | |
| 35 | Groups | /api/groups | POST | `{ topic, type, houseId, date, ...data }` | `{ houseId(@NotBlank), date(@NotBlank), topic?, leaderId?, notes?, type?, time?, status?, attendance? }` | ⚠️ | Task spec listed `title` and `therapistId` — neither exists in backend DTO. Frontend actually sends `topic` (matches). Frontend does not send `leaderId` (it's `therapistId` in the task spec, but neither field is sent from the Groups page `onCreateGroup` call). |
| 36 | Groups | /api/groups/{id} | PATCH | `{ topic?, notes?, leaderId?, status?, attendance? }` | `{ topic?, notes?, leaderId?, status?, attendance? }` | ✅ | |
| 37 | Groups | /api/groups/{groupId}/attendance | PUT | `{ patientId, status }` | `{ patientId(@NotBlank), status(@NotBlank, present\|absent) }` | ✅ | |
| 38 | Therapy | /api/therapy?houseId=X | GET | `houseId` param | `houseId`(@NotBlank) | ✅ | |
| 39 | Therapy | /api/therapy | POST | `{ patientId, topic, notes, counselorNote?, urgency?, therapistId: user.id }` | `{ patientId(@NotBlank), therapistId(@NotBlank), date?, topic?, notes?, counselorNote?, urgency? }` | ✅ | Frontend spreads `newT` (has patientId, topic, notes, counselorNote, urgency) and adds `therapistId: user.id` |
| 40 | Therapist Assignments | /api/therapist-assignments?houseId=X | GET | `houseId` param | `houseId`(@NotBlank) | ✅ | Returns `Map<patientId, therapistId>` |
| 41 | Therapist Assignments | /api/therapist-assignments | PUT | `{ patientId, therapistId }` | `{ patientId(@NotBlank), therapistId? }` | ✅ | Null/blank `therapistId` triggers delete |
| 42 | Schedule | /api/schedule?houseId=X | GET | `houseId` param | `houseId`(@NotBlank) | ✅ | |
| 43 | Schedule | /api/schedule/assign | PUT | `{ houseId, date, counselorId, note }` | `{ houseId(@NotBlank), date(@NotBlank), counselorId?, note? }` | ✅ | |
| 44 | Summary | /api/summary?houseId=X | GET | `houseId` param | `houseId`(@NotBlank) | ✅ | Handled by SummaryCompatController |
| 45 | Summary | /api/summary | POST | `{ houseId, counselorId, generalText, patientSummaries }` | `{ counselorId(@NotBlank), houseId(@NotBlank), date?(server-computed if absent), generalText?, patientSummaries? }` | ✅ | SummaryCompatController auto-sets date and notifiedAt server-side |

---

## Issues Found

### BLOCKING (500/400 на happy path)

None found. All endpoints exist, HTTP methods match, required fields are sent.

---

### DATA (неверные данные в UI / data integrity risks)

**1. Meds — `prescribedBy` field is missing in UI (POST and PATCH)**
- Endpoint: `POST /api/meds`, `PATCH /api/meds/{id}`
- Backend DTO has optional `prescribedBy` (maps from `prescribedBy`). The frontend form (MedManager, EditMedRow) has no prescriber input field at all.
- Impact: `prescribedBy` is always null in the database. If this field is displayed anywhere in the UI, it will always be blank.
- Severity: DATA — no 400 error, but prescriber information is permanently lost.

**2. Meds — `startDate`, `endDate`, `notes` not editable in PATCH flow**
- Endpoint: `PATCH /api/meds/{id}`
- EditMedRow only sends `{ name, dose, unit, times }`. Fields `startDate`, `endDate`, `notes` set on creation cannot be changed via the edit form.
- Impact: Once created, start/end dates and notes for a medication cannot be updated from the UI.
- Severity: DATA — values set at creation are frozen.

**3. Finance/Patient — `amount` and `balance` have `@Min`/`@Max` but are nullable in DTO**
- Endpoint: `POST /api/finance/patient`
- `CreateFinanceBody.amount` and `balance` are typed as `Int?` with no `@NotNull`. The persistence call uses `body.amount!!` — if the frontend sends `null`, this throws a Kotlin NPE (500, not 400).
- Frontend currently always computes and sends non-null integers, so this does not trigger in practice. However, any direct API call with a missing amount will produce a 500 instead of a 400 validation error.
- Severity: DATA/COSMETIC — not user-facing today, but a latent API robustness issue.

---

### COSMETIC

**1. Groups — task spec field names differ from actual code**
- Task spec listed `POST /api/groups` sending `{ title, type, therapistId, houseId, date }`.
- Actual frontend sends `topic` (not `title`) and does not send `therapistId` / `leaderId` when creating a quick group session.
- Backend accepts `topic` and `leaderId` (optional). No mismatch in the actual code — only a discrepancy in the audit task spec.

**2. Consequences — task spec field name differs from actual code**
- Task spec listed `POST /api/consequences` sending `note`.
- Actual frontend sends `description` which correctly matches the backend `@NotBlank description` field.
- No mismatch; task spec was incorrect.

**3. Meds — task spec field name differs from actual code**
- Task spec listed `prescriber` (frontend) and implied it maps to some backend field.
- Backend DTO field is `prescribedBy`. Frontend does not send this field at all (see DATA issue #1 above).

**4. `GET /api/meds?patientId=X` — endpoint exists but frontend does not call it directly**
- Meds are loaded as a nested collection within `GET /api/patients?houseId=X` (via `p.meds`).
- The `/api/meds` GET endpoint is unused by the current frontend. This is not a bug, but dead surface area.

**5. `GET /api/schedule` vs `PUT /api/schedule/assign` — no `POST /api/schedule`**
- Frontend only uses `GET /api/schedule` and `PUT /api/schedule/assign`.
- Backend also exposes `POST /api/schedule` (create) and `DELETE /api/schedule/{id}` — these are unused by the frontend.
- No mismatch, but unused endpoints.

**6. `GET /api/summaries` (DailySummaryController) is unused**
- Frontend uses `GET /api/summary` (SummaryCompatController) and `POST /api/summary`.
- The full `/api/summaries` CRUD (with date filter, PATCH) is a dead backend API.
