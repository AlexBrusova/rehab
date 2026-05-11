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
Returns active patients. Optionally filter by house.

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
    "alert": false,
    "dischargeType": null,
    "dischargeDate": null,
    "room": { "id": "clrrr...", "number": "101", "building": "Building A", "capacity": 2 },
    "meds": [...]
  }
]
```

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
Update a patient. Allowed fields: `name`, `dob`, `admitDate`, `roomId`, `mood`, `alert`, `status`, `dischargeType`, `dischargeDate`, `daysInRehab`.

**Request body (any subset):**
```json
{
  "mood": 8,
  "alert": true,
  "roomId": "clrrr..."
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

### GET /api/meds?patientId=:id
Returns all medications for a patient.

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
    "startDate": "01/04/2025",
    "endDate": null,
    "prescribedBy": "Dr. Katz",
    "notes": null
  }
]
```

### POST /api/meds
**Request body:**
```json
{
  "patientId": "clppp...",
  "name": "Alprazolam",
  "dose": "0.5",
  "unit": "mg",
  "times": ["morning", "evening"],
  "prescribedBy": "Dr. Katz"
}
```
**Response 201:** Created med object.

### PATCH /api/meds/:id
Update medication fields.  
**Response 200:** Updated med object.

### DELETE /api/meds/:id
**Response 200:** `{ "ok": true }`

---

## Medication Distributions

### GET /api/distributions?patientId=:id&date=:date
Returns distribution records for a patient on a given date.

**Query params:** `patientId`, `date` (format: `YYYY-MM-DD`)

**Response 200:**
```json
[
  {
    "id": "clddd...",
    "patientId": "clppp...",
    "medId": "clmmm...",
    "date": "2025-05-11",
    "time": "morning",
    "given": true,
    "givenAt": "08:15",
    "givenBy": "Sarah Cohen"
  }
]
```

### POST /api/distributions
Create distribution records (typically generated daily per med schedule).

### PATCH /api/distributions/:id
Mark a dose as given or undo.

**Request body:**
```json
{ "given": true, "givenAt": "08:15", "givenBy": "Sarah Cohen" }
```
**Response 200:** Updated distribution object.

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

### GET /api/schedule?houseId=:id
Returns counselor schedule entries.

**Response 200:**
```json
[
  {
    "id": "clsch...",
    "houseId": "clyyy...",
    "counselorId": "clxxx...",
    "date": "11/05/2025",
    "shiftType": "24h",
    "note": null
  }
]
```

### POST /api/schedule
**Request body:** `houseId`, `counselorId`, `date`, `shiftType`, `note`  
**Response 201:** Created schedule entry.

### DELETE /api/schedule/:id
**Response 200:** `{ "ok": true }`

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

## Absences

### GET /api/absences?houseId=:id
Returns absences for a house.

**Response 200:**
```json
[
  {
    "id": "claaa...",
    "patientId": "clppp...",
    "houseId": "clyyy...",
    "type": "Home Visit",
    "startDate": "10/05/2025",
    "endDate": "12/05/2025",
    "approvedBy": "Jonathan Barak",
    "status": "active",
    "returnedAt": null
  }
]
```

**Status values:** `pending`, `approved`, `active`, `returned`

### POST /api/absences
**Request body:** `patientId`, `houseId`, `type`, `startDate`, `endDate`  
**Response 201:** Created absence.

### PATCH /api/absences/:id
Approve, activate, or mark as returned.

**Request body:**
```json
{ "status": "returned", "returnedAt": "12/05/2025 14:30" }
```
**Response 200:** Updated absence.

---

## Therapy

### GET /api/therapy/assignments?houseId=:id
Returns therapist-patient assignments for a house.

**Response 200:**
```json
[
  { "patientId": "clppp...", "therapistId": "clxxx..." }
]
```

### POST /api/therapy/assignments
**Request body:** `patientId`, `therapistId`  
**Response 201:** Created assignment.

### PATCH /api/therapy/assignments/:patientId
Update therapist assignment.  
**Request body:** `therapistId`  
**Response 200:** Updated assignment.

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

### GET /api/summaries?houseId=:id&date=:date
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

### POST /api/summaries
**Request body:** `counselorId`, `houseId`, `date`, `generalText`, `patientSummaries`  
**Response 201:** Created summary.

### PATCH /api/summaries/:id
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

## Error Responses

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 401 | Unauthorized (missing or invalid token) |
| 500 | Server error (see `error` field in body) |
