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
| Cache (houses list) | Caffeine (local) / Redis TTL 1d (Docker profile `docker`) |
| Auth | JWT (12-hour tokens) |
| Frontend hosting | Vercel |
| Backend hosting | Railway (or any JVM host) |

**Railway:** set the service **Root Directory** to `backend` (not `server` — that folder was removed). Build is Dockerfile-based; details in [`backend/README.md`](backend/README.md#деплой-railway--heroku).

**Если сборка падает** с `snapshot-target-unpack/server does not exist` или в логах видно **Railpack** вместо Dockerfile: в **Settings → Root Directory** у сервиса всё ещё указан старый путь **`server`** или **`/server`** (после merge PR с Node в `server/` на Kotlin в `backend/` его нужно сменить). Поставьте **`backend`**, в **Config as code** при необходимости укажите **`/backend/railway.json`**. После смены корня Railway соберёт образ из `backend/Dockerfile`.

**Если API падает на старте из‑за БД:** переменная `DATABASE_URL` от Postgres часто без префикса `jdbc:` (`postgresql://…`). Либо задайте `jdbc:${{Postgres.DATABASE_URL}}` в Railway, либо оставьте как есть — бэкенд сам добавляет `jdbc:` при запуске (см. `backend/README.md`).

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

Full navigation map (packages, tests, monitoring): **[`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md)**.

```
rehab/
├── app/                 # React + Vite (PWA) — see docs/PROJECT_STRUCTURE.md
├── backend/             # Kotlin + Spring Boot REST API
├── db/                  # Prisma schema & migrations (PostgreSQL)
│   └── prisma/
│       └── schema.prisma
├── docs/                # api.md, business-*.md, PROJECT_STRUCTURE.md
├── docker-compose.yml   # Postgres, Redis, API, frontend, Prometheus, Grafana, Loki, Promtail
├── Makefile             # make / make up / make down / make e2e / …
├── monitoring/          # Prometheus, Loki, Grafana provisioning, Promtail
│   ├── prometheus/
│   ├── loki/
│   ├── promtail/
│   └── grafana/
└── README.md
```

`app/src/`: `pages/` (screens), `components/ui/`, `lib/api.js`, `data/`, `hooks/`; `app/e2e/` — Playwright tests.

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

### Docker (full stack: Postgres, Redis, API, UI, metrics & logs)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose v2) running.

```bash
# from repo root — build images (first time or after dependency changes)
docker compose build --no-cache
docker compose up -d
```

| Service | URL / port | Notes |
|--------|------------|--------|
| Web UI | **http://localhost:8080** | nginx + PWA; proxies `/api`, `/health`, `/actuator` to the API |
| API | **http://localhost:4000** | Kotlin Spring Boot |
| Redis | `redis:6379` (internal) | Spring cache, **TTL 1 day** for cache `houses` |
| Prometheus | **http://localhost:9090** | Scrapes `GET /actuator/prometheus` on the API |
| Grafana | **http://localhost:3000** | Login `admin` / `admin` — datasources: Prometheus + Loki; dashboard *Rehab API overview* |
| Loki | **http://localhost:3100** | Log store (Promtail pushes Docker container logs for this Compose project) |

```bash
curl -s http://localhost:4000/health
curl -s -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"org_manager1","password":"1234"}'
```

**Logs:** Promtail reads stdout/stderr of Compose services (filter: `com.docker.compose.project` = project name, usually the directory name, e.g. `rehab`). Explore logs in Grafana → Explore → Loki.

Stop and remove volumes (DB + Prometheus + Grafana + Loki):

```bash
docker compose down -v
```

Profile **`docker`**: Hibernate `ddl-auto: update`, demo seed when the user table is empty (same demo passwords as in tests). **Caching:** Redis with **1 day** TTL for `GET /api/houses` (cache name `houses`). Local `./gradlew bootRun` uses **Caffeine** with the same TTL (no Redis required).

### Frontend
```bash
cd app
npm install
npm run dev
```

Set `VITE_API_URL` in `app/.env` to your API (e.g. `http://localhost:4000`), or leave empty and use the Vite dev proxy to the same port.

### E2E tests (Playwright)

From `app/` with the API running on port **4000** (e.g. `./gradlew bootRun` in `backend/`, or Docker UI on **8080** with `PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080` and `PLAYWRIGHT_SKIP_WEBSERVER=1`):

```bash
cd app
npm install
npx playwright install chromium   # once per machine
npm run test:e2e
```

`playwright.config.ts` starts Vite on **5173** unless `PLAYWRIGHT_SKIP_WEBSERVER` is set. Service workers are blocked in tests so the PWA cache does not mask API data.

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
| מטמון (רשימת בתים) | Caffeine מקומית / Redis TTL יום (פרופיל `docker`) |
| אימות | JWT (תוקף 12 שעות) |
| אחסון צד לקוח | Vercel |
| אחסון צד שרת | Railway (או כל סביבת JVM) |

**Railway:** ב־Root Directory של השירות יש לבחור **`backend`** (לא `server` — התיקייה הוסרה). פירוט ב־[`backend/README.md`](backend/README.md).

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

מפת ניווט מלאה: **[`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md)** (כולל חבילות backend, בדיקות, ניטור).

```
rehab/
├── app/                 # React + Vite (PWA)
├── backend/             # Kotlin + Spring Boot API
├── db/
│   └── prisma/
│       └── schema.prisma
├── docs/                # api.md, business-*.md, PROJECT_STRUCTURE.md
├── docker-compose.yml
├── Makefile
├── monitoring/
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

### Docker (PostgreSQL, Redis, API, UI, ניטור ולוגים)

נדרש Docker Desktop (או Engine + Compose v2) פעיל. מהשורש של ה-repo:

```bash
docker compose build --no-cache
docker compose up -d
```

- **http://localhost:8080** — ממשק (nginx)  
- **http://localhost:4000** — API  
- **http://localhost:9090** — Prometheus  
- **http://localhost:3000** — Grafana (`admin` / `admin`)  
- **http://localhost:3100** — Loki  
לוגים של קונטיינרים נאספים ל-Loki (Promtail). מטמון Redis לרשימת בתים: **TTL יום אחד**.

```bash
docker compose down -v
```

### צד לקוח
```bash
cd app
npm install
npm run dev
```

הגדר `VITE_API_URL` ב-`app/.env` כך שיצביע ל-API, או השאר ריק והשתמש ב-proxy של Vite.
