# Frontend-Backend Audit & MVP Design

**Date:** 2026-05-17  
**Scope:** All 14 UI modules  
**Goal:** Working MVP — `make e2e` green, no 500s on prod  
**Environments:** Local Docker (`make`) + Production (https://rehab-lyart-eight.vercel.app)  
**Credentials:** `manager1/1234` (same local and prod)

---

## Approach: Hybrid (Static Audit → Fix → Playwright E2E)

Three sequential phases. Each phase ends with a memory checkpoint so future sessions know exactly where to resume.

---

## Phase 1: Static Audit

Read all frontend API calls (`app/src/lib/api.js`, `App.jsx`) and all backend controllers (`backend/src/main/kotlin/com/rehabcenter/web/`). For each endpoint, verify:

| Check | What to look for |
|-------|-----------------|
| Path | URL in frontend matches `@RequestMapping` in controller |
| HTTP method | GET/POST/PATCH/DELETE matches |
| Request fields | Field names in `api.js` match Body DTO field names |
| Required fields | `@field:NotBlank`/`@field:NotNull` in DTO are sent by frontend |
| Response fields | Frontend reads fields that backend actually returns |
| Auth | User role has access to endpoint |
| Query params | `?houseId=`, `?patientId=` match `@RequestParam` names |

**Audit order** (high-risk first):
1. Patients, Meds, Shifts
2. Finance, Phones, Consequences
3. Groups, Therapy, Schedule, Distributions
4. Rooms, Users, Summary, Absences

**Output:** `docs/audit/frontend-backend-audit.md` — one row per endpoint, status ✅/❌/⚠️.

**Checkpoint:** Save audit table + summary to memory at phase end.

---

## Phase 2: Fix

Two fix paths based on problem location:

**Backend issues** (wrong DTO field, path, method, validation):
- Use `/dev-agent "issue description"` pipeline
- TDD approach: test first (RED) → fix (GREEN) → PR → CI

**Frontend issues** (wrong field in `api.js`, wrong URL, wrong response parsing):
- Direct edits to `app/src/lib/api.js` or component
- Commit → PR

**Fix priority:**
1. Blocking — 500/400 on happy path
2. Data — wrong data shown in UI
3. Cosmetic — UI glitches not affecting functionality

**Checkpoint:** List of closed PRs + remaining open issues saved to memory.

---

## Phase 3: Playwright E2E Tests

One spec file per module in `app/tests/`:

```
app/tests/
  auth.spec.ts
  patients.spec.ts
  meds.spec.ts
  shifts.spec.ts
  phones.spec.ts
  consequences.spec.ts
  finance.spec.ts
  groups.spec.ts
  therapy.spec.ts
  schedule.spec.ts
  distributions.spec.ts
  rooms.spec.ts
  absences.spec.ts
  summary.spec.ts
```

Each spec covers:
- **Happy path** — create → appears in list
- **Error case** — invalid input → error shown in UI (not 500)
- **Auth** — no token → redirect to login

Tests run against local Docker stack (`make` → API on `:4000`, UI on `:8080`). Seed data: `manager1/1234`.

Final step: add `npm run test:e2e` to GitHub Actions after `backend-ci`.

**Checkpoint:** Status per spec file (pass/fail) + prod verification result saved to memory.

---

## Definition of MVP Done

- [ ] `make e2e` green — all 14 spec files pass
- [ ] Prod Vercel: login → navigate all modules → no 500s
- [ ] GitHub Actions: `backend-ci` + `e2e-ci` green on master

---

## Known Issues (Pre-Audit)

- **Fixed (merged):** Patient.status PG enum → TEXT (PR #11, #12)
- **Fixed (PR #13, open):** `@JsonIgnoreProperties(ignoreUnknown=true)` missing on 30+ Body DTOs; Finance amount/balance `@NotNull` added
- **Known mismatch (handled):** Med times — frontend sends boolean fields (`morning/noon/evening/night`), backend expects `times: List<String>`. Conversion exists in `medFormToApiBody()` and `toFrontendMed()`.
