# Rehab Center Management System — Business Documentation

## 1. System Overview

**Product name:** Rehab Center  
**Type:** Internal web application (PWA — works on mobile like a native app)  
**Purpose:** Digital management platform for residential rehabilitation centers

The system centralizes all day-to-day operations of a rehab facility into one tool: patient tracking, medication management, counselor shifts, finances, therapy sessions, and more. It is designed to be used by staff on mobile devices during their shifts.

The system supports **multi-house organizations** — one organization can manage multiple rehab houses from a single account, with access control per employee.

---

## 2. User Roles

### org_manager — Organization Manager
- Access to **all houses** in the organization
- Can create and manage all users
- Full access to every module
- Typically used by the organization director or administrator

### manager — House Manager
- Access to **their assigned house** only (or multiple if explicitly granted)
- Can manage staff schedules
- Can approve/reject consequences and absences
- Full operational access within their house

### counselor — Counselor
- Access to **their assigned house**
- Manages day-to-day patient operations
- Records shifts, writes daily summaries
- Handles phones, absences, consequences
- Cannot manage medications (read only)

### doctor — Doctor
- Access to **their assigned house**
- Full medication management (add, edit, delete, mark as given)
- Can view all patient information

### therapist — Emotional Therapist
- Access to **their assigned house**
- Manages therapy sessions and patient assignments
- Can write session notes and flag urgent cases

---

## 3. Modules

### 3.1 Dashboard
The main screen visible after login. Shows a real-time overview of the house:

- Total active patients, patients currently away
- Mood indicator (average mood across all patients)
- Alerts — patients flagged as requiring attention
- Upcoming shifts
- Pending consequences awaiting approval
- Recent therapy session urgency flags
- Phone tracking summary (how many phones are out)
- Group sessions scheduled for today

### 3.2 Patients
Core module. Displays all active patients in the current house.

**Features:**
- View list of active patients (sorted by admission date)
- View archived (discharged) patients
- Add new patient (name, date of birth, admission date, room assignment)
- Open patient profile
- Discharge a patient with discharge type (successful, self-discharge, escape)

**Patient Profile contains:**
- Basic info: name, date of birth, days in rehab, current room, mood score
- Alert flag (marks patient for urgent attention)
- Medications tab — list of all current meds
- Absences tab — history of home visits and leave
- Finances tab — patient's personal balance and transactions
- Therapy tab — assigned therapist and session history
- Consequences tab — disciplinary records

### 3.3 Rooms
Manages the physical rooms of the house.

**Features:**
- View all rooms grouped by building, with current occupancy vs. capacity
- Add new rooms (number, building, capacity)
- Edit room details
- Delete empty rooms
- Assign unassigned patients to a room
- Transfer a patient from one room to another
- Remove a patient from a room (vacate)

### 3.4 Medications
Two sub-modules:

**Med Manager:**
- Doctor-only view
- Add, edit, delete medications for patients
- Set dosing schedule (morning / noon / evening / night)
- Set start/end dates and prescribing doctor

**Medication Distribution:**
- Daily checklist for dispensing medications
- Mark each dose as given, with timestamp and staff name
- View which doses are pending for the current time slot

### 3.5 Groups
Tracks therapeutic group sessions.

**Features:**
- View all group sessions for the current house
- Create a new group session (date, topic, session leader)
- Mark patient attendance (present / absent) for each session
- Add session notes

### 3.6 Phones
Tracks temporary phone usage by patients (phones are typically restricted in rehab).

**Features:**
- Issue a phone to a patient with a return time
- Mark a phone as returned
- Automatically flag late returns
- View history of phone sessions

### 3.7 Shifts
Records counselor shift handovers.

**Features:**
- View shifts for the current house by date
- Create a new shift record
- Accept shift (confirm start)
- Record handover: who you received the shift from and who you handed it to
- Add shift notes
- Mark shift as completed

**Shift statuses:** pending → ACTIVE → completed

### 3.8 Schedule
Visual counselor schedule (which counselor works which day).

**Features:**
- View monthly calendar of counselor assignments
- Add a counselor to a date/shift type
- Remove a schedule entry
- Used by managers to plan coverage

### 3.9 Consequences
Disciplinary record system for patient rule violations.

**Features:**
- Create a consequence record (type, description, date)
- Types: verbal warning, written warning, phone confiscation, room restriction, meeting required, other
- Manager approves or rejects each consequence
- Pending consequences are flagged on the Dashboard
- Full history visible in patient profile

### 3.10 Finance
Two sub-modules:

**Patient Finances:**
- Each patient has a personal balance (e.g. pocket money)
- Record deposits (family sends money) and withdrawals (patient purchases)
- Running balance history

**House Cashbox:**
- Track the house cash drawer (income and expenses)
- Categories: supplies, food, transport, etc.
- Record cashbox counts (physical money count vs. expected)
- Flag discrepancies

### 3.11 Absences
Manages approved leave from the facility.

**Features:**
- Request an absence for a patient (type: home visit, errands, medical, other)
- Set start and expected return date
- Manager approves or rejects
- Mark patient as returned when they come back
- Absence history stored per patient

**Absence statuses:** pending → approved → active → returned

### 3.12 Management Center
Admin module, visible mainly to managers and org managers.

**Tabs:**
- **Staff** — view, add, edit employees. Set role, phone, house access. New users get default password `1234`.
- **Schedule** — manage counselor shift schedule
- **Therapists** — assign therapists to patients

### 3.13 Therapy
Therapy session management, primarily for therapists.

**Features:**
- View assigned patients
- Create session records (date, topic, notes)
- Flag session urgency (Normal / Urgent)
- Urgent sessions appear on the Dashboard and notify the counselor on duty
- Counselors can add follow-up notes to sessions

### 3.14 Daily Summary
End-of-shift report written by the counselor.

**Features:**
- Write a general summary of the day
- Write individual notes for each patient
- Submit the summary (timestamped)
- Managers can view all submitted summaries by date

---

## 4. Access Control by Role

| Module | org_manager | manager | counselor | doctor | therapist |
|--------|-------------|---------|-----------|--------|-----------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Patients (view) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Patients (add/discharge) | ✅ | ✅ | ✅ | — | — |
| Rooms | ✅ | ✅ | ✅ | — | — |
| Med Manager | ✅ | ✅ | — | ✅ | — |
| Medications (distribution) | ✅ | ✅ | ✅ | ✅ | — |
| Groups | ✅ | ✅ | ✅ | — | — |
| Phones | ✅ | ✅ | ✅ | — | — |
| Shifts | ✅ | ✅ | ✅ | — | — |
| Schedule | ✅ | ✅ | — | — | — |
| Consequences (create) | ✅ | ✅ | ✅ | — | — |
| Consequences (approve) | ✅ | ✅ | — | — | — |
| Finance | ✅ | ✅ | ✅ | — | — |
| Absences | ✅ | ✅ | ✅ | — | — |
| Management Center | ✅ | ✅ | — | — | — |
| Therapy | ✅ | ✅ | view only | — | ✅ |
| Daily Summary | ✅ | ✅ | ✅ | — | — |

---

## 5. Multi-House Logic

- Each user belongs to one primary house (`houseId`) or has access to multiple houses via `allowedHouses`
- Users with `allHousesAccess: true` (typically org_manager) see all houses and can switch between them
- When a user switches houses, all data (patients, rooms, shifts, etc.) reloads for the selected house
- Patients, rooms, and all operational data are always scoped to a single house

---

## 6. Key Business Rules

1. A patient can only be in one room at a time
2. A room cannot be deleted if it has patients assigned
3. A patient cannot be discharged without selecting a discharge type
4. Consequences require manager approval before taking effect
5. Absences require manager approval before the patient can leave
6. Medication distributions are generated per patient per day based on their med schedule
7. Therapy sessions flagged as URGENT appear on the Dashboard
8. A counselor's shift must be explicitly accepted before it becomes ACTIVE
9. Phone return time is tracked; late returns are flagged automatically
10. Each patient has exactly one assigned therapist (or none)

---

## 7. Data Model Summary

| Entity | Key fields |
|--------|-----------|
| House | name, city, color |
| User | username, name, role, houseId, allHousesAccess |
| Patient | name, dob, admitDate, houseId, roomId, status, mood, alert |
| Room | number, building, capacity, houseId |
| Med | name, dose, unit, times[], patientId |
| MedDistribution | medId, patientId, date, time, given, givenBy |
| Group | date, topic, leaderId, houseId |
| GroupAttendance | groupId, patientId, present |
| Phone | patientId, givenAt, returnBy, returnedAt, status |
| Shift | counselorId, houseId, date, shift, status |
| Schedule | counselorId, houseId, date, shiftType |
| Consequence | patientId, type, description, status, approvedBy |
| Finance | patientId, type, amount, balance |
| CashboxEntry | houseId, type, amount, cat, balance |
| CashboxCount | houseId, amount, expected, diff |
| Absence | patientId, type, startDate, endDate, status |
| TherapistAssignment | patientId, therapistId |
| TherapySession | patientId, therapistId, date, topic, urgency |
| DailySummary | counselorId, houseId, date, generalText, patientSummaries |

---

## 8. MVP Scope

The following is included in the MVP (v1):

- ✅ Authentication (login, JWT session, auto-restore on reload)
- ✅ Multi-house support with house switcher
- ✅ Patient management (create, view, edit, discharge)
- ✅ Room management (create, edit, delete, assign patients)
- ✅ User management (create, edit staff accounts)
- ✅ Medication management (add, edit, delete, distribution checklist)
- ✅ Group sessions with attendance tracking
- ✅ Phone tracking (issue, return, late flag)
- ✅ Counselor shifts (create, accept, handover, complete)
- ✅ Shift schedule planning
- ✅ Consequences (create, approve/reject)
- ✅ Patient finances and house cashbox
- ✅ Absence management (request, approve, return)
- ✅ Therapy sessions and therapist assignments
- ✅ Daily shift summaries
- ✅ Dashboard with real-time house overview
- ✅ PWA — installable on iOS/Android, works offline for cached views

**Out of scope for MVP:**
- Push notifications
- Document/file uploads
- Reporting / analytics exports
- External integrations (pharmacies, insurance, etc.)
- Audit log
