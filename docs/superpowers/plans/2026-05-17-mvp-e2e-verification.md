# MVP E2E Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `make e2e` green on all spec files, verify prod has no 500s, confirm CI green on master.

**Architecture:** Run Docker stack → execute Playwright suite → triage failures by category (Docker/API/UI) → fix → re-run → verify prod → push to master.

**Tech Stack:** Docker Compose, Playwright (TypeScript), Kotlin Spring Boot API on :4000, Nginx UI on :8080, PostgreSQL + Redis.

---

## File Map

| File | Role |
|------|------|
| `Makefile` | `make e2e` = runs Playwright against Docker stack |
| `app/playwright.config.ts` | PLAYWRIGHT_BASE_URL=http://localhost:8080, workers=1, retries=2 on CI |
| `app/e2e/helpers.ts` | loginAsManager, goToScreen, expectToast |
| `app/e2e/api-health.spec.ts` | 14 GET endpoints — all < 500 |
| `app/e2e/auth-login.spec.ts` | Login valid/invalid |
| `app/e2e/dashboard-status.spec.ts` | Dashboard + patient profile |
| `app/e2e/feature-screens.spec.ts` | All screens load (UI check) |
| `app/e2e/forms-crud.spec.ts` | Patients/groups/consequences CRUD + validation |
| `app/e2e/navigation-rapid.spec.ts` | Rapid navigation |
| `app/e2e/navigation-roles.spec.ts` | 5 roles × their screens |
| `app/e2e/shifts-phones-rooms.spec.ts` | Rooms create, Shifts load, Phones load |
| `app/e2e/finance-meds-therapy.spec.ts` | Finance, Meds, Therapy load + Therapy create |
| `app/e2e/absences-summary-manage.spec.ts` | Absences, Summary, Manage load |
| `app/e2e/missing-crud.spec.ts` | CRUD: Shifts/Phones/Meds/Finance/Schedule/Distributions/Users |
| `.github/workflows/e2e-ci.yml` | CI: docker compose up → wait health → npm ci → playwright install → run |

Known-good testids in app:
- `login-username`, `login-password`, `login-submit` — `src/Login.jsx`
- `sidebar-toggle`, `page-title` — `src/App.jsx`
- `toast` — `src/components/ui/Toast.jsx`
- `nav-{id}` — dynamically rendered, id from `src/data/constants.js`

Valid nav IDs for `manager1`: `dashboard`, `patients`, `rooms`, `medmanager`, `medications`, `groups`, `phones`, `absences`, `summary`, `shifts`, `consequences`, `finance`, `manage`, `therapy`

---

## Task 1: Start Docker stack

**Files:** none (infrastructure)

- [ ] **Step 1: Start stack**

```bash
cd /path/to/rehab
make
```

Expected: docker compose starts all services. May take 2-5 min on first run.

- [ ] **Step 2: Verify all containers running**

```bash
docker compose ps
```

Expected output — all `Status` columns show `Up` or `healthy`:
```
NAME                    STATUS
rehab-api-1             Up (healthy)
rehab-ui-1              Up
rehab-db-1              Up (healthy)
rehab-redis-1           Up
rehab-prometheus-1      Up
rehab-grafana-1         Up
rehab-loki-1            Up
```

If a container is `Exiting` or `Restarting` — check logs:
```bash
docker compose logs api --tail=50
docker compose logs ui --tail=50
```

- [ ] **Step 3: Verify API health**

```bash
curl -s http://localhost:4000/health
```

Expected: `{"status":"UP"}` or `OK` (2xx). If 000/refused: wait 30s, retry. If still failing → `docker compose logs api --tail=100`.

- [ ] **Step 4: Verify UI serves**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080
```

Expected: `200`. If not → `docker compose logs ui --tail=50`.

---

## Task 2: First E2E run — capture baseline

**Files:** `app/e2e/*.spec.ts`

- [ ] **Step 1: Run full suite, save output**

```bash
make e2e 2>&1 | tee /tmp/e2e-run1.txt
```

- [ ] **Step 2: Summarise results**

```bash
grep -E "passed|failed|skipped|×|✓|✘" /tmp/e2e-run1.txt | tail -30
```

- [ ] **Step 3: List failing tests**

```bash
grep "×\|FAILED\|Error:" /tmp/e2e-run1.txt | head -40
```

**If all tests pass → skip to Task 7 (prod verification).**

---

## Task 3: Fix category A — stack/login failures

These block every other test. Fix first.

**Symptom:** `loginAsManager` times out waiting for `[data-testid="login-submit"]` or for `GET /api/patients?houseId=` with `ok()`.

- [ ] **Step 1: Check seed data**

```bash
docker compose exec db psql -U postgres -d rehab -c "SELECT username, role FROM \"User\" LIMIT 10;"
```

Expected: rows with `manager1`, `org_manager1`, `counselor1`, `doctor1`, `therapist1`.

If empty: seed didn't run.

```bash
docker compose logs api --tail=200 | grep -i "seeder\|seed\|demo"
```

If no seeder log: restart API with docker compose restart api, or manually trigger by checking `RehabDemoSeeder`.

- [ ] **Step 2: Check patients data**

```bash
docker compose exec db psql -U postgres -d rehab -c "SELECT COUNT(*) FROM \"Patient\";"
```

Expected: > 0. If 0 — seed failed.

- [ ] **Step 3: Manual login smoke test**

Open http://localhost:8080 in browser. Login with `manager1` / `1234`. If it fails → check API logs for auth errors.

---

## Task 4: Fix category B — API 4xx / 5xx

**Symptom:** A spec asserts `res.status() < 500` (or < 400) and fails.

- [ ] **Step 1: Identify which endpoint is failing**

```bash
grep -A 3 "×" /tmp/e2e-run1.txt | grep "api/"
```

- [ ] **Step 2: Check backend logs for stack trace**

```bash
docker compose logs api --tail=200 | grep -A 10 "ERROR\|Exception"
```

- [ ] **Step 3: For 500 errors — use /dev-agent**

If the error is a backend bug, run in a new terminal:

```
/dev-agent "fix: GET /api/{endpoint} returns 500 — [paste error from logs]"
```

- [ ] **Step 4: For 400 errors — check DTO mismatch**

400 on POST/PATCH means the request body doesn't match what the backend expects. Check the spec that's failing:

```bash
grep -A 20 "failing test name" app/e2e/missing-crud.spec.ts
```

Compare the fields being sent with the backend DTO. The DTO is in:
```
backend/src/main/kotlin/com/rehabcenter/web/{Entity}Controller.kt
```

Look for the `@RequestBody data: SomeBody` parameter and match field names.

Fix in the spec file — update field names to match the DTO.

- [ ] **Step 5: Commit fix**

```bash
git add app/e2e/
git commit -m "fix(e2e): align request fields with backend DTOs"
```

---

## Task 5: Fix category C — UI selector mismatches

**Symptom:** `page.getByRole("button", { name: /start shift/i })` times out — button exists but has different label.

- [ ] **Step 1: Run Playwright with UI (headed) to observe failing test**

```bash
cd app
PLAYWRIGHT_BASE_URL=http://localhost:8080 PLAYWRIGHT_SKIP_WEBSERVER=1 \
  npx playwright test e2e/missing-crud.spec.ts --headed --timeout=0
```

Watch the browser — note what the actual button text is.

- [ ] **Step 2: Update selector in spec**

Open the failing spec. Find the `getByRole("button", { name: /regex/i })` that doesn't match. Update the regex to match the actual label.

Example — if button says "Start My Shift":
```typescript
// Before
const startBtn = page.getByRole("button", { name: /start shift|begin shift/i });
// After
const startBtn = page.getByRole("button", { name: /start.*shift|begin shift/i });
```

- [ ] **Step 3: Run the fixed spec in isolation**

```bash
cd app
PLAYWRIGHT_BASE_URL=http://localhost:8080 PLAYWRIGHT_SKIP_WEBSERVER=1 \
  npx playwright test e2e/missing-crud.spec.ts
```

Expected: `1 passed` (or more).

- [ ] **Step 4: Commit**

```bash
git add app/e2e/missing-crud.spec.ts
git commit -m "fix(e2e): update button selectors to match actual UI labels"
```

Repeat Steps 1-4 for each failing spec.

---

## Task 6: Fix category D — navigation failures

**Symptom:** `goToScreen(page, "therapy")` times out — `[data-testid="nav-therapy"]` not in DOM.

This happens when `manager1` doesn't have `therapy` in their nav list, OR the sidebar is not open when the nav is queried.

- [ ] **Step 1: Verify nav ID for role**

Open `app/src/data/constants.js`. Find the nav config for `manager` role (second block). Confirm `therapy` is listed.

If not listed: the screen doesn't exist for this role. Update the test to skip or use a role that has the nav item.

- [ ] **Step 2: Check sidebar toggle**

`goToScreen` calls `openSidebar` which clicks `[data-testid="sidebar-toggle"]`. If sidebar is already open on second call, the toggle might close it. Check:

```typescript
// In helpers.ts — openSidebar is not idempotent. If already open, skip:
export async function goToScreen(page: Page, navId: string) {
  const sidebar = page.locator("[data-testid='sidebar-toggle']");
  const nav = page.getByTestId(`nav-${navId}`);
  const navVisible = await nav.isVisible({ timeout: 1000 }).catch(() => false);
  if (!navVisible) {
    await sidebar.click();
  }
  await page.getByTestId(`nav-${navId}`).click();
}
```

If `openSidebar` is the bug, update `helpers.ts`:

```typescript
export async function goToScreen(page: Page, navId: string) {
  const nav = page.getByTestId(`nav-${navId}`);
  const isVisible = await nav.isVisible({ timeout: 1500 }).catch(() => false);
  if (!isVisible) {
    await page.getByTestId("sidebar-toggle").click();
    await page.getByTestId(`nav-${navId}`).waitFor({ state: "visible", timeout: 8000 });
  }
  await nav.click();
}
```

- [ ] **Step 3: Run affected spec**

```bash
cd app
PLAYWRIGHT_BASE_URL=http://localhost:8080 PLAYWRIGHT_SKIP_WEBSERVER=1 \
  npx playwright test e2e/navigation-roles.spec.ts
```

- [ ] **Step 4: Commit**

```bash
git add app/e2e/helpers.ts
git commit -m "fix(e2e): make goToScreen idempotent — skip toggle if nav already visible"
```

---

## Task 7: Re-run full suite — confirm green

- [ ] **Step 1: Run full suite**

```bash
make e2e 2>&1 | tee /tmp/e2e-run2.txt
```

- [ ] **Step 2: Check results**

```bash
grep -E "passed|failed" /tmp/e2e-run2.txt | tail -5
```

Expected: `N passed, 0 failed`.

If still failures: identify new category, apply Task 3/4/5/6 fix pattern, re-run.

- [ ] **Step 3: Commit final state if any fixes not yet committed**

```bash
git status
git add app/e2e/
git commit -m "fix(e2e): all specs green against Docker stack"
```

---

## Task 8: Prod verification

**URL:** https://rehab-lyart-eight.vercel.app  
**Credentials:** `manager1` / `1234`

- [ ] **Step 1: Login**

Open https://rehab-lyart-eight.vercel.app. Enter `manager1` / `1234`. Click Login.

Expected: Dashboard screen loads, patient list visible, no error toast.

- [ ] **Step 2: Navigate all 14 screens**

Click each nav item in order. For each screen, confirm it loads data (no 500 toast, no blank/error state):

| Screen | Nav ID | What to confirm |
|--------|--------|-----------------|
| Dashboard | dashboard | patient list visible |
| Patients | patients | patient cards visible |
| Room Map | rooms | room grid visible |
| Medication Management | medmanager | med list visible |
| Medication Distribution | medications | distribution rows visible |
| Groups | groups | group list visible |
| Phones | phones | phone list visible |
| Absences | absences | loads without error |
| Daily Summary | summary | loads without error |
| Shifts | shifts | shift list visible |
| Consequences | consequences | loads without error |
| General (Finance) | finance | finance panel visible |
| Management Center | manage | loads without error |
| Session Records | therapy | therapy records visible |

- [ ] **Step 3: Record any 500s**

Open browser DevTools → Network tab → filter status >= 500. If any appear:

```
Note: endpoint, status, error message
→ File issue or /dev-agent "fix: POST /api/... returns 500 on prod — [message]"
```

---

## Task 9: Push to master and verify CI

- [ ] **Step 1: Verify clean state**

```bash
git status
git log --oneline -5
```

- [ ] **Step 2: Push**

```bash
git push origin master
```

- [ ] **Step 3: Monitor CI**

```bash
gh run watch --exit-status
```

Expected: `e2e-ci` job green. If it fails:

```bash
gh run view --log-failed
```

Download artifact if needed:
```bash
gh run download --name playwright-report
```

Open `playwright-report/index.html` in browser for visual trace.

- [ ] **Step 4: Confirm both workflows green**

```bash
gh run list --limit 5
```

Expected: `backend-ci` ✅ and `e2e-ci` ✅ on latest master commit.

---

## Task 10: Update memory checkpoint

- [ ] **Step 1: Save final MVP status to memory**

In Claude Code conversation, say: "обнови memory MVP статус — make e2e зелёный, прод верифицирован, CI зелёный"

This triggers a memory write to `project_mvp_audit_progress.md` marking all items complete.

---

## Definition of Done

- [ ] `make e2e` — 0 failed
- [ ] Prod: all 14 screens load without 500
- [ ] GitHub Actions `e2e-ci` — green on master
- [ ] Memory checkpoint updated
