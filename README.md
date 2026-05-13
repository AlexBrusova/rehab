# Rehab Center — Management System

A full-stack web application for managing residential rehabilitation centers. Built as a PWA (Progressive Web App) — installable on iOS and Android and usable like a native app.

---

## Overview

The system centralizes all day-to-day operations of a rehab facility into one tool, accessible from any device. It supports multi-house organizations: one organization can run multiple rehab houses from a single account, with role-based access control per employee.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite (PWA) |
| Backend API | Kotlin + Spring Boot 3 |
| Database | PostgreSQL |
| Schema / migrations | Prisma (`db/` package) |
| Auth | JWT (12-hour tokens) |
| Frontend hosting | Vercel |
| Backend hosting | Railway (or any JVM host) |

---

## Key Features

- **Patient management** — admission, room assignment, discharge, profile with full history
- **Medication management** — prescriptions, dosing schedules, daily shift distribution checklist
- **Absence tracking** — record patient leave, mark return; absent patients are excluded from all daily operational views
- **Counselor shifts** — create, accept, handover, and complete shift records
- **Shift schedule** — monthly calendar assigning counselors to dates
- **Therapist assignments** — assign one therapist per patient
- **Therapy sessions** — session notes, urgency flags, counselor follow-ups
- **Group sessions** — create groups, track attendance
- **Phone tracking** — issue phones with return times, flag late returns
- **Consequences** — create disciplinary records, manager approval workflow
- **Finances** — patient personal balance + house cashbox with count records
- **Daily summaries** — end-of-shift reports with per-patient notes
- **Dashboard** — real-time house overview: mood, alerts, pending items

---

## User Roles

| Role | Access |
|------|--------|
| `org_manager` | All houses, all modules, full staff management |
| `manager` | Their house, full operations, schedule editing, approvals |
| `counselor` | Their house, daily operations (shifts, groups, phones, absences) |
| `doctor` | Medication management |
| `therapist` | Therapy sessions and patient assignments |

---

## Project Structure

```
rehab/
├── app/          # React frontend (Vite PWA)
│   └── src/
│       ├── pages/        # Screen components
│       ├── components/   # Shared UI components
│       └── data/         # Constants, colors
├── backend/      # Kotlin + Spring Boot REST API
├── db/           # Prisma schema & DB migrations (PostgreSQL)
│   └── prisma/
│       └── schema.prisma
├── docs/
│   ├── api.md            # Full API documentation
│   ├── business-en.md   # Business documentation (English)
│   └── business-ru.md   # Business documentation (Russian)
└── README.md
```

---

## API

Base URL: `https://rehab-production-552d.up.railway.app`

All endpoints require `Authorization: Bearer <token>` except `/api/auth/login`.

Full API reference: [`docs/api.md`](docs/api.md)

---

## Running Locally

### Database schema (Prisma)
```bash
cd db
npm install
cp .env.example .env   # set DATABASE_URL
npx prisma generate
npx prisma migrate dev   # or: npx prisma db push
```

### Backend API (Kotlin)
```bash
cd backend
./gradlew bootRun
```
Uses port **4000** by default (`PORT` / `application.yml`). JDBC URL: `jdbc:postgresql://...` (see `backend/.env.example`).

### Frontend
```bash
cd app
npm install
npm run dev
```

Set `VITE_API_URL` in `app/.env` to your API (e.g. `http://localhost:4000`), or leave empty and use the Vite dev proxy to the same port.

---

---

# מרכז שיקום — מערכת ניהול

אפליקציית ווב מלאה לניהול מרכזי שיקום למגורים. בנויה כ-PWA (Progressive Web App) — ניתן להתקינה על iOS ו-Android ולהשתמש בה כמו אפליקציה מקורית.

---

## סקירה כללית

המערכת מרכזת את כל פעולות היום-יום של מתקן שיקום בכלי אחד, נגיש מכל מכשיר. המערכת תומכת בארגונים מרובי-בתים: ארגון אחד יכול לנהל מספר בתי שיקום מחשבון יחיד, עם בקרת גישה לפי תפקיד לכל עובד.

---

## טכנולוגיות

| שכבה | טכנולוגיה |
|------|-----------|
| צד לקוח | React + Vite (PWA) |
| צד שרת API | Kotlin + Spring Boot 3 |
| מסד נתונים | PostgreSQL |
| סכמה / מיגרציות | Prisma (חבילת `db/`) |
| אימות | JWT (תוקף 12 שעות) |
| אחסון צד לקוח | Vercel |
| אחסון צד שרת | Railway (או כל סביבת JVM) |

---

## תכונות עיקריות

- **ניהול מטופלים** — קבלה, שיבוץ חדרים, שחרור, פרופיל עם היסטוריה מלאה
- **ניהול תרופות** — מרשמים, לוח מינונים, רשימת בדיקה יומית לחלוקת תרופות לפי משמרת
- **מעקב היעדרויות** — תיעוד יציאת מטופל, סימון חזרה; מטופלים נעדרים אינם מופיעים בכל תצוגות פעולה יומיות
- **משמרות יועצים** — יצירה, קבלה, מסירה וסיום של רשומות משמרת
- **לוח זמנים משמרות** — לוח חודשי לשיבוץ יועצים לתאריכים
- **שיבוץ מטפלים** — שיבוץ מטפל אחד לכל מטופל
- **מפגשי טיפול** — הערות מפגש, דגלי דחיפות, מעקב יועץ
- **מפגשי קבוצה** — יצירת קבוצות, מעקב נוכחות
- **מעקב טלפונים** — הנפקת טלפונים עם זמן החזרה, סימון איחורים
- **תוצאות** — יצירת רשומות משמעת, תהליך אישור מנהל
- **כספים** — יתרה אישית למטופל + קופה בית עם רשומות ספירה
- **סיכומים יומיים** — דוחות סיום משמרת עם הערות לכל מטופל
- **לוח בקרה** — סקירת בית בזמן אמת: מצב רוח, התראות, פריטים ממתינים

---

## תפקידי משתמשים

| תפקיד | גישה |
|--------|------|
| `org_manager` | כל הבתים, כל המודולים, ניהול צוות מלא |
| `manager` | הבית שלו, פעולות מלאות, עריכת לוח זמנים, אישורים |
| `counselor` | הבית שלו, פעולות יומיות (משמרות, קבוצות, טלפונים, היעדרויות) |
| `doctor` | ניהול תרופות |
| `therapist` | מפגשי טיפול ושיבוץ מטופלים |

---

## מבנה הפרויקט

```
rehab/
├── app/          # צד לקוח React (Vite PWA)
│   └── src/
│       ├── pages/        # רכיבי מסכים
│       ├── components/   # רכיבי UI משותפים
│       └── data/         # קבועים, צבעים
├── backend/      # Kotlin + Spring Boot REST API
├── db/           # Prisma — סכמה ומיגרציות PostgreSQL
│   └── prisma/
│       └── schema.prisma
├── docs/
│   ├── api.md            # תיעוד API מלא
│   ├── business-en.md   # תיעוד עסקי (אנגלית)
│   └── business-ru.md   # תיעוד עסקי (רוסית)
└── README.md
```

---

## API

כתובת בסיס: `https://rehab-production-552d.up.railway.app`

כל הנקודות קצה דורשות `Authorization: Bearer <token>` למעט `/api/auth/login`.

תיעוד API מלא: [`docs/api.md`](docs/api.md)

---

## הרצה מקומית

### סכמת מסד (Prisma)
```bash
cd db
npm install
cp .env.example .env   # הגדר DATABASE_URL
npx prisma generate
npx prisma migrate dev   # או: npx prisma db push
```

### צד שרת API (Kotlin)
```bash
cd backend
./gradlew bootRun
```

### צד לקוח
```bash
cd app
npm install
npm run dev
```

הגדר `VITE_API_URL` ב-`app/.env` כך שיצביע ל-API, או השאר ריק והשתמש ב-proxy של Vite.
