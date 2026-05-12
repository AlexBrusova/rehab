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
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL (via Prisma ORM) |
| Auth | JWT (12-hour tokens) |
| Frontend hosting | Vercel |
| Backend hosting | Railway |

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
├── server/       # Express backend (TypeScript)
│   └── src/
│       ├── routes/       # API route handlers
│       ├── middleware/   # Auth middleware
│       └── lib/          # Prisma client
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

### Backend
```bash
cd server
npm install
npx prisma generate
npm run dev
```

### Frontend
```bash
cd app
npm install
npm run dev
```

Set `VITE_API_URL` in `app/.env` to point to your backend.

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
| צד שרת | Node.js + Express + TypeScript |
| מסד נתונים | PostgreSQL (דרך Prisma ORM) |
| אימות | JWT (תוקף 12 שעות) |
| אחסון צד לקוח | Vercel |
| אחסון צד שרת | Railway |

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
├── server/       # צד שרת Express (TypeScript)
│   └── src/
│       ├── routes/       # מטפלי נתיבי API
│       ├── middleware/   # Middleware אימות
│       └── lib/          # Prisma client
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

### צד שרת
```bash
cd server
npm install
npx prisma generate
npm run dev
```

### צד לקוח
```bash
cd app
npm install
npm run dev
```

הגדר `VITE_API_URL` ב-`app/.env` כך שיצביע לצד השרת שלך.
