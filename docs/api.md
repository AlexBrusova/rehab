# Rehab Center — API Documentation

**Base URL:** `https://rehab-production-552d.up.railway.app`  
**Format:** JSON  
**Authentication:** Bearer JWT token (except `/api/auth/login`)

---

## Authentication

All endpoints (except login) require an `Authorization` header:

```
Authorization: Bearer <token>
```

Token is obtained on login and expires in **12 hours**.

---

## POST /api/auth/login

Login and receive a JWT token.

**Request body:**
```json
{
  "username": "manager1",
  "password": "1234"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "clxxx...",
    "username": "manager1",
    "name": "Jonathan Barak",
    "role": "manager",
    "roleLabel": "House Manager",
    "initials": "JB",
    "color": "#1e5fa8",
    "phone": null,
    "allHousesAccess": false,
    "houseId": "clyyy...",
    "allowedHouses": [{ "userId": "clxxx...", "houseId": "clyyy..." }],
    "house": { "id": "clyyy...", "name": "Phoenix House", "city": "Tel Aviv", "color": "#0d7377" }
  }
}
```

**Response 401:** `{ "error": "Invalid credentials" }`

---

## Houses

### GET /api/houses
Returns all houses. Users see all houses; filtering by role is handled on the frontend.

**Response 200:**
```json
[
  {
    "id": "clyyy...",
    "name": "Phoenix House",
    "city": "Tel Aviv",
    "color": "#0d7377",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

---

## Users

### GET /api/users
Returns all users (without password hashes).

**Response 200:** Array of user objects (same shape as login response user, without `house` relation).

### POST /api/users
Create a new user. Default password is `1234` if not specified.

**Request body:**
```json
{
  "name": "Sarah Cohen",
  "username": "sarah1",
  "role": "counselor",
  "roleLabel": "Counselor",
  "initials": "SC",
  "color": "#1e5fa8",
  "phone": "050-0000000",
  "allHousesAccess": false,
  "houseId": "clyyy...",
  "password": "1234"
}
```

**Response 201:** Created user object.  
**Response 500:** `{ "error": "Server error" }` (e.g. username already exists)

### PATCH /api/users/:id
Update a user. All fields are optional. Pass `password` to change it.

**Request body (any subset of):**
```json
{
  "name": "Sarah Cohen",
  "phone": "050-1111111",
  "role": "manager",
  "roleLabel": "House Manager",
  "password": "newpassword"
}
```

**Response 200:** Updated user object.

---

## Patients

### GET /api/patients
Returns active + away patients for a house. Patients with `awayType` set are returned with `status: "away"`.

**Query params:**
- `houseId` (optional) — filter by house ID

**Response 200:** Array of patient objects including nested `room` and `meds`.

```json
[
  {
    "id": "clppp...",
    "name": "David Levi",
    "dob": "15/03/1985",
    "admitDate": "01/04/2025",
    "daysInRehab": 40,
    "mood": 7,
    "roomId": "clrrr...",
    "houseId": "clyyy...",
    "status": "active",
    "awayType": null,
    "alert": false,
    "dischargeType": null,
    "dischargeDate": null,
    "room": { "id": "clrrr...", "number": "101", "building": "Building A", "capacity": 2 },
    "meds": [...]
  }
]
```

When a patient is absent, `status` is `"away"` and `awayType` is set (e.g. `"Home Visit"`).

### GET /api/patients/archived
Returns archived (discharged) patients for a house. Uses raw SQL to bypass Prisma enum matching.

**Query params:**
- `houseId` — required

**Response 200:** Array of patient objects (no nested relations).

### POST /api/patients
Create a new patient.

**Request body:**
```json
{
  "name": "New Patient",
  "dob": "01/01/1990",
  "admitDate": "11/05/2025",
  "houseId": "clyyy...",
  "roomId": "clrrr..."
}
```

**Response 201:** Created patient object.

### PATCH /api/patients/:id
Update a patient. Allowed fields: `name`, `dob`, `admitDate`, `roomId`, `mood`, `alert`, `status`, `dischargeType`, `dischargeDate`, `daysInRehab`, `awayType`.

To mark a patient as absent: set `awayType` to the absence type string.  
To mark a patient as returned: set `awayType` to `null`.

**Request body (any subset):**
```json
{
  "awayType": "Home Visit"
}
```

**Response 200:** Updated patient object.

### DELETE /api/patients/:id
Soft-delete: sets patient `status` to `archived`.

**Response 200:** `{ "ok": true }`

---

## Rooms

### GET /api/rooms
Returns rooms, optionally filtered by house.

**Query params:** `houseId` (optional)

**Response 200:**
```json
[
  { "id": "clrrr...", "number": "101", "building": "Building A", "capacity": 2, "houseId": "clyyy..." }
]
```

### POST /api/rooms
**Request body:**
```json
{ "number": "105", "building": "Building B", "capacity": 2, "houseId": "clyyy..." }
```
**Response 201:** Created room object.

### PATCH /api/rooms/:id
**Request body (any subset):** `number`, `building`, `capacity`  
**Response 200:** Updated room object.

### DELETE /api/rooms/:id
Permanently deletes a room. Will fail if patients are assigned to it.  
**Response 200:** `{ "ok": true }`

---

## Medications

Medications are stored in the `Med` table and linked to a patient. Dosing times are stored as a string array internally but the API accepts and returns boolean flags for convenience.

### GET /api/meds?patientId=:id
Returns all medications for a patient. Response includes both `times[]` and boolean flags.

**Response 200:**
```json
[
  {
    "id": "clmmm...",
    "patientId": "clppp...",
    "name": "Alprazolam",
    "dose": "0.5",
    "unit": "mg",
    "times": ["morning", "evening"],
    "morning": true,
    "noon": false,
    "evening": true,
    "night": false,
    "startDate": "01/04/2025",
    "endDate": null,
    "prescribedBy": "Dr. Katz",
    "notes": null
  }
]
```

### POST /api/meds
Create a new medication. Pass boolean flags for dosing times.

**Request body:**
```json
{
  "patientId": "clppp...",
  "name": "Alprazolam",
  "dose": "0.5",
  "unit": "mg",
  "morning": true,
  "noon": false,
  "evening": true,
  "night": false
}
```
**Response 201:** Created med object (with boolean flags).

### PATCH /api/meds/:id
Update medication fields. Pass only the fields to change. Boolean time flags are merged with existing values (omitting a flag keeps its current value).

**Request body (any subset):**
```json
{
  "dose": "1.0",
  "evening": false
}
```
**Response 200:** Updated med object (with boolean flags).

### DELETE /api/meds/:id
**Response 200:** `{ "ok": true }`

---

## Medication Distributions (Shift Distribution)

Tracks whether each patient received their medications per shift per day. Stored in the `ShiftDist` table with composite primary key `(patientId, shift, date)`.

**Shift values:** `morning`, `noon`, `evening`, `night`  
**Status values:** `given`, `missed`, `pending`

### GET /api/distributions?houseId=:id&date=:date
Returns all shift distribution records for a house on a given date.

**Query params:**
- `houseId` — required
- `date` — required, format: `DD/MM/YYYY`

**Response 200:**
```json
[
  {
    "patientId": "clppp...",
    "shift": "morning",
    "date": "11/05/2025",
    "status": "given"
  }
]
```

### PUT /api/distributions
Upsert a distribution record. Creates it if it doesn't exist; updates `status` if it does.

**Request body:**
```json
{
  "patientId": "clppp...",
  "shift": "morning",
  "date": "11/05/2025",
  "status": "given"
}
```
**Response 200:** `{ "patientId", "shift", "date", "status" }`

---

## Therapist Assignments

Maps patients to their assigned therapist. One patient → one therapist (or none).

### GET /api/therapist-assignments?houseId=:id
Returns a map of `{ patientId: therapistId }` for all patients in the house.

**Response 200:**
```json
{
  "clppp...": "clxxx...",
  "clppp2...": "clxxx2..."
}
```

### PUT /api/therapist-assignments
Assign or unassign a therapist. If `therapistId` is omitted or null, the assignment is deleted.

**Request body:**
```json
{
  "patientId": "clppp...",
  "therapistId": "clxxx..."
}
```

To unassign:
```json
{
  "patientId": "clppp...",
  "therapistId": null
}
```

**Response 200:** `{ "patientId", "therapistId" }`

---

## Groups

### GET /api/groups?houseId=:id&date=:date
Returns groups for a house, optionally filtered by date.

**Response 200:**
```json
[
  {
    "id": "clggg...",
    "houseId": "clyyy...",
    "date": "11/05/2025",
    "topic": "Relapse Prevention",
    "leaderId": "clxxx...",
    "notes": null,
    "attendance": [
      { "groupId": "clggg...", "patientId": "clppp...", "present": true }
    ]
  }
]
```

### POST /api/groups
**Request body:**
```json
{
  "houseId": "clyyy...",
  "date": "11/05/2025",
  "topic": "Relapse Prevention",
  "leaderId": "clxxx..."
}
```
**Response 201:** Created group object.

### PATCH /api/groups/:id
Update group or attendance.  
**Response 200:** Updated group object.

---

## Phones

### GET /api/phones?houseId=:id
Returns all active phone sessions (not yet returned) for a house.

**Response 200:**
```json
[
  {
    "id": "clphh...",
    "patientId": "clppp...",
    "givenAt": "10:00",
    "returnBy": "11:00",
    "returnedAt": null,
    "late": false,
    "status": "active"
  }
]
```

### POST /api/phones
Issue a phone to a patient.

**Request body:**
```json
{
  "patientId": "clppp...",
  "givenAt": "10:00",
  "returnBy": "11:00"
}
```
**Response 201:** Created phone record.

### PATCH /api/phones/:id
Return a phone or mark as late.

**Request body:**
```json
{ "returnedAt": "11:05", "late": true, "status": "returned" }
```
**Response 200:** Updated phone record.

---

## Shifts

### GET /api/shifts?houseId=:id&date=:date
Returns shifts for a house, optionally filtered by date.

**Response 200:**
```json
[
  {
    "id": "clsss...",
    "houseId": "clyyy...",
    "counselorId": "clxxx...",
    "date": "11/05/2025",
    "shift": "24h",
    "status": "ACTIVE",
    "note": null,
    "receivedFrom": "Mike",
    "handedTo": null,
    "accepted": true,
    "start": "08:00",
    "end": null
  }
]
```

### POST /api/shifts
**Request body:**
```json
{
  "houseId": "clyyy...",
  "counselorId": "clxxx...",
  "date": "11/05/2025",
  "shift": "24h"
}
```
**Response 201:** Created shift.

### PATCH /api/shifts/:id
Update shift status, notes, handover info.  
**Response 200:** Updated shift.

---

## Schedule

Counselor assignment calendar. Each entry assigns one counselor to one day. Only one counselor per house per date is supported (the PUT replace endpoint enforces this).

### GET /api/schedule?houseId=:id
Returns all schedule entries for a house.

**Response 200:**
```json
[
  {
    "id": "clsch...",
    "houseId": "clyyy...",
    "counselorId": "clxxx...",
    "date": "11/05/2025",
    "shiftType": "24h",
    "shift": "24h",
    "note": null
  }
]
```

Note: `shift` is an alias for `shiftType` added by the server for frontend compatibility.

### PUT /api/schedule/assign
Atomically replace the counselor assignment for a given date. Deletes any existing entry for that `houseId + date`, then creates a new one if `counselorId` is provided. Use this to both assign and unassign.

**Request body:**
```json
{
  "houseId": "clyyy...",
  "date": "11/05/2025",
  "counselorId": "clxxx...",
  "note": ""
}
```

To unassign (remove coverage for a day):
```json
{
  "houseId": "clyyy...",
  "date": "11/05/2025",
  "counselorId": null
}
```

**Response 200:** Created schedule entry, or `null` if unassigned.

---

## Consequences

### GET /api/consequences?houseId=:id
Returns consequences for a house.

**Response 200:**
```json
[
  {
    "id": "clccc...",
    "patientId": "clppp...",
    "houseId": "clyyy...",
    "type": "verbal_warning",
    "description": "Violated phone policy",
    "date": "11/05/2025",
    "status": "pending",
    "approvedBy": null
  }
]
```

**Consequence status values:** `pending`, `approved`, `rejected`

### POST /api/consequences
**Request body:**
```json
{
  "patientId": "clppp...",
  "houseId": "clyyy...",
  "type": "verbal_warning",
  "description": "Violated phone policy",
  "date": "11/05/2025"
}
```
**Response 201:** Created consequence.

### PATCH /api/consequences/:id
Approve or reject a consequence.

**Request body:**
```json
{ "status": "approved", "approvedBy": "Jonathan Barak" }
```
**Response 200:** Updated consequence.

---

## Finance (Patient)

### GET /api/finance?patientId=:id
Returns financial transactions for a patient.

**Response 200:**
```json
[
  {
    "id": "clff...",
    "patientId": "clppp...",
    "type": "deposit",
    "amount": 500,
    "source": "Family",
    "note": "Weekly allowance",
    "date": "11/05/2025",
    "balance": 500
  }
]
```

**Type values:** `deposit`, `withdrawal`

### POST /api/finance
**Request body:**
```json
{
  "patientId": "clppp...",
  "type": "deposit",
  "amount": 500,
  "source": "Family",
  "note": "Weekly allowance",
  "date": "11/05/2025",
  "balance": 500
}
```
**Response 201:** Created transaction.

---

## Cashbox

### GET /api/cashbox?houseId=:id
Returns cashbox transactions for a house.

**Response 200:**
```json
[
  {
    "id": "clcb...",
    "houseId": "clyyy...",
    "type": "deposit",
    "amount": 200,
    "cat": "Supplies",
    "note": "Cleaning supplies",
    "date": "11/05/2025",
    "time": "10:30",
    "by": "Sarah Cohen",
    "balance": 1200
  }
]
```

### POST /api/cashbox
**Request body:** `houseId`, `type`, `amount`, `cat`, `note`, `date`, `time`, `by`, `balance`  
**Response 201:** Created cashbox entry.

### GET /api/cashbox/counts?houseId=:id
Returns cashbox count records.

### POST /api/cashbox/counts
**Request body:** `houseId`, `countedBy`, `amount`, `expected`, `diff`, `date`, `time`, `notes`  
**Response 201:** Created count record.

---

## Therapy

### GET /api/therapy/sessions?patientId=:id
Returns therapy sessions for a patient.

**Response 200:**
```json
[
  {
    "id": "clttt...",
    "patientId": "clppp...",
    "therapistId": "clxxx...",
    "date": "11/05/2025",
    "topic": "Family Relations",
    "notes": "Patient made progress...",
    "urgency": "NORMAL",
    "counselorNote": null
  }
]
```

**Urgency values:** `NORMAL`, `URGENT`

### POST /api/therapy/sessions
**Request body:** `patientId`, `therapistId`, `date`, `topic`, `notes`, `urgency`  
**Response 201:** Created session.

### PATCH /api/therapy/sessions/:id
**Request body (any subset):** `topic`, `notes`, `urgency`, `counselorNote`  
**Response 200:** Updated session.

---

## Daily Summaries

### GET /api/summary?houseId=:id&date=:date
Returns daily summaries for a house, optionally filtered by date.

**Response 200:**
```json
[
  {
    "id": "clsum...",
    "counselorId": "clxxx...",
    "houseId": "clyyy...",
    "date": "11/05/2025",
    "generalText": "Quiet day overall...",
    "patientSummaries": { "clppp...": "Patient was calm and cooperative" },
    "notifiedAt": "22:00"
  }
]
```

### POST /api/summary
**Request body:** `counselorId`, `houseId`, `date`, `generalText`, `patientSummaries`  
**Response 201:** Created summary.

### PATCH /api/summary/:id
**Request body (any subset):** `generalText`, `patientSummaries`, `notifiedAt`  
**Response 200:** Updated summary.

---

## Roles Reference

| Role | Value | Description |
|------|-------|-------------|
| Org Manager | `org_manager` | Full access to all houses and settings |
| House Manager | `manager` | Full access within their house |
| Counselor | `counselor` | Shift-based access, daily operations |
| Doctor | `doctor` | Medication management |
| Therapist | `therapist` | Therapy sessions and assignments |

---

## Schema Notes

### Patient `awayType` field
The `Patient` table has an `awayType TEXT` column (nullable). When set, the GET `/api/patients` response returns `status: "away"` for that patient instead of `"active"`. This avoids changing the PostgreSQL enum and keeps the approach simple.

To mark as absent: `PATCH /api/patients/:id` with `{ "awayType": "Home Visit" }`  
To mark as returned: `PATCH /api/patients/:id` with `{ "awayType": null }`

### ShiftDist table
The `ShiftDist` table is created via raw SQL in `ensureSchema()` on server start (not via Prisma migration). It has composite primary key `(patientId, shift, date)`. Upserts use `ON CONFLICT ... DO UPDATE`.

### ensureSchema migrations
The server runs `ensureSchema()` on startup, applying `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for columns added after the initial Prisma migration. Each migration step is wrapped independently so a failure in one step does not block subsequent steps.

---

## Error Responses

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 401 | Unauthorized (missing or invalid token) |
| 500 | Server error (see `error` field in body) |
