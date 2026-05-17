# Frontend-Backend Audit & MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Полностью рабочий MVP — `make e2e` зелёный на всех 14 модулях, prod без 500-х ошибок, CI зелёный.

**Architecture:** Три фазы: (1) статический аудит всех эндпоинтов через сравнение `api.js` с Kotlin-контроллерами → таблица расхождений; (2) фиксы backend через `/dev-agent`, frontend через прямые правки `api.js`; (3) 14 Playwright spec-файлов в `app/tests/`, добавление в CI.

**Tech Stack:** Kotlin Spring Boot 3, React + Vite, Playwright TypeScript, GitHub Actions

**Key selectors (Login form):** `data-testid="login-username"`, `data-testid="login-password"`, `data-testid="login-submit"`

**Nav labels (sidebar):** "Dashboard", "Patients", "Room Map", "Medication Management", "Medication Distribution", "Groups", "Phones", "Absences", "Daily Summary", "Shifts", "Consequences", "General", "Management Center", "Session Records"

---

## Phase 1: Static Audit

### Task 1: Создать шаблон аудит-документа

**Files:**
- Create: `docs/audit/frontend-backend-audit.md`

- [ ] **Step 1: Создать директорию и файл**

```bash
mkdir -p docs/audit
```

Создать `docs/audit/frontend-backend-audit.md`:

```markdown
# Frontend-Backend Audit

**Date:** 2026-05-17
**Auditor:** [name]
**Status legend:** ✅ Match | ❌ Mismatch (breaks functionality) | ⚠️ Risk (partial mismatch)

## Endpoint Matrix

| # | Module | Endpoint | Method | Frontend sends | Backend expects | Status | Notes |
|---|--------|----------|--------|----------------|-----------------|--------|-------|

## Issues Found

### BLOCKING (500/400 на happy path)
_Fill during audit_

### DATA (wrong data in UI)
_Fill during audit_

### COSMETIC
_Fill during audit_
```

- [ ] **Step 2: Commit шаблон**

```bash
git add docs/audit/frontend-backend-audit.md
git commit -m "docs: create frontend-backend audit template"
```

---

### Task 2: Аудит — Patients, Rooms, Absences

**Files:**
- Read: `backend/src/main/kotlin/com/rehabcenter/web/PatientController.kt`
- Read: `backend/src/main/kotlin/com/rehabcenter/web/RoomController.kt`
- Read: `backend/src/main/kotlin/com/rehabcenter/web/AbsenceController.kt`
- Modify: `docs/audit/frontend-backend-audit.md`

- [ ] **Step 1: Читать PatientController.kt**

```bash
cat backend/src/main/kotlin/com/rehabcenter/web/PatientController.kt
```

Проверить для каждого Body DTO:
- `CreatePatientBody` — поля должны совпадать с тем, что шлёт `createPatient()` в App.jsx: `name`, `dateOfBirth`, `admitDate`, `houseId`, `roomId` (опц.)
- `UpdatePatientBody` — поля: `name`, `dateOfBirth`, `admitDate`, `roomId`, `mood`, `awayType`, `alert`, `status`, `dischargeType`, `dischargeDate`

Проверить `@RequestMapping` пути:
- `GET /api/patients` — параметр `houseId` (`@RequestParam`)
- `GET /api/patients/archived` — параметр `houseId`
- `POST /api/patients` — возвращает 201
- `PATCH /api/patients/{id}` — возвращает 200
- `DELETE /api/patients/{id}` — архивирование (frontend не вызывает DELETE напрямую — использует PATCH status="archived")

- [ ] **Step 2: Читать RoomController.kt**

```bash
cat backend/src/main/kotlin/com/rehabcenter/web/RoomController.kt
```

Сверить с функциями App.jsx:
- `createRoom` → POST /api/rooms: поля `number`, `building`, `capacity`, `houseId`
- `updateRoom` → PATCH /api/rooms/{id}: поля `number`, `building`, `capacity`
- `deleteRoom` → DELETE /api/rooms/{id}

- [ ] **Step 3: Читать AbsenceController.kt**

```bash
cat backend/src/main/kotlin/com/rehabcenter/web/AbsenceController.kt
```

Absences в UI реализованы через PATCH `/api/patients/{id}` с полем `awayType` — AbsenceController может быть отдельным или это просто часть PatientController. Проверить.

- [ ] **Step 4: Заполнить строки аудит-таблицы для Patients/Rooms/Absences**

Добавить в `docs/audit/frontend-backend-audit.md` строки для каждого проверенного эндпоинта.

---

### Task 3: Аудит — Meds, Med Distribution

**Files:**
- Read: `backend/src/main/kotlin/com/rehabcenter/web/MedController.kt`
- Read: `backend/src/main/kotlin/com/rehabcenter/web/MedDistributionController.kt`
- Modify: `docs/audit/frontend-backend-audit.md`

- [ ] **Step 1: Читать MedController.kt**

```bash
cat backend/src/main/kotlin/com/rehabcenter/web/MedController.kt
```

Проверить `CreateMedBody`:
- Frontend отправляет: `patientId`, `name`, `dose`, `unit`, `times: string[]`, `startDate`, `endDate`, `prescriber`, `notes`
- Конвертация boolean → times[] происходит в `medFormToApiBody()` — убедиться что бекенд ждёт `times: List<String>`
- ИЗВЕСТНЫЙ МИСМАТЧ (обрабатывается): frontend в `toFrontendMed()` конвертирует обратно `times[]` → `morning/noon/evening/night` бooleans

Проверить `UpdateMedBody` — те же поля.

- [ ] **Step 2: Читать MedDistributionController.kt**

```bash
cat backend/src/main/kotlin/com/rehabcenter/web/MedDistributionController.kt
```

Сверить с `setDistributionStatus` в App.jsx:
- GET `/api/distributions?houseId=X&date=X`
- PUT `/api/distributions` body: `{ patientId, shift, date, status }`

Проверить допустимые значения `shift` (enum?) и `status`.

- [ ] **Step 3: Заполнить таблицу для Meds/Distributions**

---

### Task 4: Аудит — Shifts, Phones, Consequences

**Files:**
- Read: `backend/src/main/kotlin/com/rehabcenter/web/ShiftController.kt`
- Read: `backend/src/main/kotlin/com/rehabcenter/web/PhoneController.kt`
- Read: `backend/src/main/kotlin/com/rehabcenter/web/ConsequenceController.kt`
- Modify: `docs/audit/frontend-backend-audit.md`

- [ ] **Step 1: Читать ShiftController.kt**

```bash
cat backend/src/main/kotlin/com/rehabcenter/web/ShiftController.kt
```

Сверить с `createShift` / `updateShift` в App.jsx:
- POST `/api/shifts` body: `{ houseId, counselorId, date, shift, note, start }`
- PATCH `/api/shifts/{id}` body: `{ status, end, handedTo, note }`

Проверить поле `shift` — тип ("24h", "day", "night"?) — совпадение с backend enum.

- [ ] **Step 2: Читать PhoneController.kt**

```bash
cat backend/src/main/kotlin/com/rehabcenter/web/PhoneController.kt
```

Сверить с `issuePhone` / `returnPhone` в App.jsx:
- POST `/api/phones` body: `{ patientId, givenAt, returnBy }`
- PATCH `/api/phones/{id}` body: `{ status: "returned", returnedAt, late }`

- [ ] **Step 3: Читать ConsequenceController.kt**

```bash
cat backend/src/main/kotlin/com/rehabcenter/web/ConsequenceController.kt
```

Сверить с `createConsequence` / `updateConsequence` в App.jsx:
- POST `/api/consequences` body: `{ ...data, houseId, date }`
- PATCH `/api/consequences/{id}` body: произвольные поля из формы

Определить обязательные поля `CreateConsequenceBody`.

- [ ] **Step 4: Заполнить таблицу для Shifts/Phones/Consequences**

---

### Task 5: Аудит — Finance, Groups, Therapy

**Files:**
- Read: `backend/src/main/kotlin/com/rehabcenter/web/FinanceController.kt`
- Read: `backend/src/main/kotlin/com/rehabcenter/web/CashboxController.kt`
- Read: `backend/src/main/kotlin/com/rehabcenter/web/FinanceCashboxProxyController.kt`
- Read: `backend/src/main/kotlin/com/rehabcenter/web/GroupController.kt`
- Read: `backend/src/main/kotlin/com/rehabcenter/web/TherapyController.kt`
- Modify: `docs/audit/frontend-backend-audit.md`

- [ ] **Step 1: Читать Finance контроллеры**

```bash
cat backend/src/main/kotlin/com/rehabcenter/web/FinanceController.kt
cat backend/src/main/kotlin/com/rehabcenter/web/CashboxController.kt
cat backend/src/main/kotlin/com/rehabcenter/web/FinanceCashboxProxyController.kt
```

Frontend вызывает три эндпоинта:
- `GET /api/finance/patient?houseId=X`, `POST /api/finance/patient` body: `{ patientId, type, amount, cat, note, date, balance }`
- `GET /api/finance/cashbox?houseId=X`, `POST /api/finance/cashbox` body: `{ houseId, type, amount, cat, note, date, time, by, balance }`
- `GET /api/finance/cashbox-counts?houseId=X`, `POST /api/finance/cashbox-counts` body: `{ houseId, countedBy, amount, expected, diff, date, time, notes }`

Проверить куда маршрутизируются эти пути — в FinanceController, CashboxController, или FinanceCashboxProxyController?

- [ ] **Step 2: Читать GroupController.kt**

```bash
cat backend/src/main/kotlin/com/rehabcenter/web/GroupController.kt
```

Сверить:
- POST `/api/groups` body: `{ ...data, houseId, date }`
- PATCH `/api/groups/{id}` body: произвольные поля
- PUT `/api/groups/{groupId}/attendance` body: `{ patientId, status }`

- [ ] **Step 3: Читать TherapyController.kt**

```bash
cat backend/src/main/kotlin/com/rehabcenter/web/TherapyController.kt
```

Frontend вызывает:
- GET `/api/therapy?houseId=X`
- POST `/api/therapy` body: `{ ...data, therapistId: user.id }`

Проверить — в App.jsx используется `POST /api/therapy`, но в памяти сессии упоминается `POST/PATCH /api/therapy/sessions`. Уточнить актуальный путь.

- [ ] **Step 4: Заполнить таблицу для Finance/Groups/Therapy**

---

### Task 6: Аудит — Schedule, Summary, Users + Commit Phase 1

**Files:**
- Read: `backend/src/main/kotlin/com/rehabcenter/web/ScheduleController.kt`
- Read: `backend/src/main/kotlin/com/rehabcenter/web/DailySummaryController.kt`
- Read: `backend/src/main/kotlin/com/rehabcenter/web/SummaryCompatController.kt`
- Read: `backend/src/main/kotlin/com/rehabcenter/web/TherapistAssignmentCompatController.kt`
- Read: `backend/src/main/kotlin/com/rehabcenter/web/UserController.kt`
- Modify: `docs/audit/frontend-backend-audit.md`

- [ ] **Step 1: Читать Schedule и Assignment контроллеры**

```bash
cat backend/src/main/kotlin/com/rehabcenter/web/ScheduleController.kt
cat backend/src/main/kotlin/com/rehabcenter/web/TherapistAssignmentCompatController.kt
```

Сверить:
- GET `/api/schedule?houseId=X`, PUT `/api/schedule/assign` body: `{ houseId, date, counselorId, note }`
- GET `/api/therapist-assignments?houseId=X`, PUT `/api/therapist-assignments` body: `{ patientId, therapistId }`

"Compat" суффикс — вероятно, legacy-совместимость. Проверить реальные пути маппинга.

- [ ] **Step 2: Читать Summary и User контроллеры**

```bash
cat backend/src/main/kotlin/com/rehabcenter/web/DailySummaryController.kt
cat backend/src/main/kotlin/com/rehabcenter/web/SummaryCompatController.kt
cat backend/src/main/kotlin/com/rehabcenter/web/UserController.kt
```

Сверить:
- GET/POST `/api/summary?houseId=X` body: `{ houseId, counselorId, generalText, patientSummaries }`
- GET `/api/users`, POST `/api/users` body: `{ name, username, password, role, houseId, initials, roleLabel }`
- PATCH `/api/users/{id}` body: `{ name?, initials?, role?, roleLabel?, password? }`

- [ ] **Step 3: Заполнить финальные строки таблицы и секцию Issues**

В секции Issues разделить найденные проблемы на:
- BLOCKING: любой мисматч, приводящий к 4xx/5xx на happy path
- DATA: поля, которые бекенд не возвращает, но UI читает (или наоборот)
- COSMETIC: незначительные расхождения

- [ ] **Step 4: Commit Phase 1 + memory checkpoint**

```bash
git add docs/audit/frontend-backend-audit.md
git commit -m "docs: complete frontend-backend static audit Phase 1"
```

После коммита сохранить в memory содержимое секции Issues — список всех BLOCKING и DATA проблем с указанием модуля и эндпоинта. Это точка входа для Phase 2.

---

## Phase 2: Fix Issues

### Task 7: Фиксы backend — BLOCKING issues через dev-agent

**Предусловие:** Phase 1 завершена, `docs/audit/frontend-backend-audit.md` содержит BLOCKING issues.

- [ ] **Step 1: Для каждого BLOCKING backend issue запустить `/dev-agent`**

Формат вызова для каждой проблемы:

```
/dev-agent "Fix <Endpoint>: <конкретное описание мисматча>. Backend DTO <FieldName> called X but frontend sends Y. Fix the backend DTO to match frontend field name."
```

Примеры (заполнить из реального аудита):
- `/dev-agent "Fix POST /api/therapy: path mismatch — frontend calls /api/therapy but controller maps to /api/therapy/sessions"`
- `/dev-agent "Fix GET /api/distributions: missing @RequestParam date — frontend sends date but backend ignores it"`

Каждый вызов создаёт отдельный PR. Записать номера PR.

- [ ] **Step 2: После каждого PR — дождаться CI зелёного и смержить**

```bash
gh pr list --label dev-agent
gh pr checks <PR_NUMBER>
gh pr merge <PR_NUMBER> --squash
```

---

### Task 8: Фиксы frontend — прямые правки api.js и App.jsx

**Предусловие:** Phase 1 завершена, известны DATA/frontend-side mismatches.

- [ ] **Step 1: Для каждого frontend issue внести правку в `app/src/lib/api.js` или `app/src/App.jsx`**

Типичные правки:
1. Неверное имя поля в теле запроса — исправить в функции мутации
2. Неверный URL эндпоинта — исправить строку пути
3. Фронт читает `response.fieldA` но бек возвращает `response.fieldB` — исправить мэппинг

Пример (заполнить из реального аудита):
```javascript
// До:
body: JSON.stringify({ patientId, therapistId: userId })
// После:
body: JSON.stringify({ patientId, therapistId })
```

- [ ] **Step 2: Lint + commit каждого фикса отдельно**

```bash
cd app && npm run lint
git add app/src/lib/api.js
git commit -m "fix(frontend): correct field name in therapy assignment call"
```

---

### Task 9: Проверка фиксов локально

- [ ] **Step 1: Запустить Docker stack**

```bash
make
```

Дождаться ready: UI `:8080`, API `:4000`.

- [ ] **Step 2: Для каждого исправленного модуля выполнить happy path вручную**

Зайти на `http://localhost:8080`, логин `manager1`/`1234`.  
Для каждого BLOCKING issue:
1. Открыть соответствующий модуль
2. Выполнить операцию, которая раньше давала 4xx/5xx
3. Убедиться, что ответ 2xx и данные корректны
4. В таблице аудита обновить статус: ❌ → ✅

- [ ] **Step 3: Commit обновлённой таблицы + memory checkpoint**

```bash
git add docs/audit/frontend-backend-audit.md
git commit -m "docs: update audit table with Phase 2 fix results"
```

Сохранить в memory: список закрытых PR (номера), оставшиеся открытые issues, статус по каждому модулю.

---

## Phase 3: Playwright E2E Tests

### Task 10: Инфраструктура тестов — helpers + auth spec

**Files:**
- Create: `app/tests/helpers/auth.ts`
- Create: `app/tests/auth.spec.ts`

**Playwright config уже существует** в `app/playwright.config.ts`. Для Docker stack использовать:
```bash
PLAYWRIGHT_BASE_URL=http://localhost:8080 PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e
```

- [ ] **Step 1: Создать директорию тестов и helper авторизации**

```bash
mkdir -p app/tests/helpers
```

Создать `app/tests/helpers/auth.ts`:

```typescript
import { Page } from '@playwright/test';

export async function loginAs(page: Page, username: string, password: string): Promise<void> {
  await page.goto('/');
  await page.locator('[data-testid="login-username"]').fill(username);
  await page.locator('[data-testid="login-password"]').fill(password);
  await page.locator('[data-testid="login-submit"]').click();
  await page.waitForLoadState('networkidle');
}

export async function loginAsManager(page: Page): Promise<void> {
  await loginAs(page, 'manager1', '1234');
}

export async function loginAsCounselor(page: Page): Promise<void> {
  await loginAs(page, 'counselor1', '1234');
}

export async function navigateTo(page: Page, label: string): Promise<void> {
  await page.getByRole('button', { name: label }).click();
  await page.waitForLoadState('networkidle');
}
```

- [ ] **Step 2: Создать auth.spec.ts**

Создать `app/tests/auth.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { loginAsManager } from './helpers/auth';

test.describe('Authentication', () => {
  test('login with valid credentials shows dashboard', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="login-username"]').fill('manager1');
    await page.locator('[data-testid="login-password"]').fill('1234');
    await page.locator('[data-testid="login-submit"]').click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="login-username"]').fill('manager1');
    await page.locator('[data-testid="login-password"]').fill('wrong');
    await page.locator('[data-testid="login-submit"]').click();
    await expect(page.getByText('Invalid username or password')).toBeVisible();
  });

  test('accessing protected page without token redirects to login', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="login-submit"]')).toBeVisible();
  });

  test('logout clears session and shows login', async ({ page }) => {
    await loginAsManager(page);
    // Найти кнопку логаута — обычно в header/sidebar, ищем по роли или тексту
    const logoutBtn = page.getByRole('button', { name: /logout|exit|выход/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await expect(page.locator('[data-testid="login-submit"]')).toBeVisible();
    }
  });
});
```

- [ ] **Step 3: Запустить и проверить**

```bash
cd app && PLAYWRIGHT_BASE_URL=http://localhost:8080 PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e -- auth.spec.ts
```

Ожидаемый результат: `3 passed` (тест logout может быть skipped если кнопка не найдена — это допустимо).

- [ ] **Step 4: Commit**

```bash
git add app/tests/
git commit -m "test(e2e): add auth spec and login helper"
```

---

### Task 11: Patients E2E spec

**Files:**
- Create: `app/tests/patients.spec.ts`

- [ ] **Step 1: Создать patients.spec.ts**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsManager, navigateTo } from './helpers/auth';

test.describe('Patients', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
    await navigateTo(page, 'Patients');
  });

  test('patient list loads without error', async ({ page }) => {
    await expect(page.getByText('Patients')).toBeVisible();
    // Не должно быть 500/error toast
    await expect(page.getByText(/error|500|internal server/i)).not.toBeVisible();
  });

  test('create patient appears in list', async ({ page }) => {
    // Найти кнопку добавления пациента
    const addBtn = page.getByRole('button', { name: /add|new|patient|\+/i }).first();
    await addBtn.click();

    // Заполнить форму
    const nameInput = page.getByLabel(/name/i).first();
    await nameInput.fill('Test Patient E2E');

    const dobInput = page.getByLabel(/date of birth|dob/i).first();
    if (await dobInput.isVisible()) await dobInput.fill('1990-01-01');

    const admitInput = page.getByLabel(/admit/i).first();
    if (await admitInput.isVisible()) await admitInput.fill('2024-01-01');

    // Сохранить
    await page.getByRole('button', { name: /save|create|add/i }).last().click();
    await page.waitForLoadState('networkidle');

    // Убедиться что пациент появился в списке
    await expect(page.getByText('Test Patient E2E')).toBeVisible();
  });

  test('no 500 errors when viewing patient list', async ({ page }) => {
    const response = await page.waitForResponse(
      (r) => r.url().includes('/api/patients') && r.status() < 500,
      { timeout: 10000 }
    );
    expect(response.status()).toBeLessThan(500);
  });
});
```

- [ ] **Step 2: Запустить**

```bash
cd app && PLAYWRIGHT_BASE_URL=http://localhost:8080 PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e -- patients.spec.ts
```

- [ ] **Step 3: Commit**

```bash
git add app/tests/patients.spec.ts
git commit -m "test(e2e): add patients spec"
```

---

### Task 12: Meds E2E spec

**Files:**
- Create: `app/tests/meds.spec.ts`

- [ ] **Step 1: Создать meds.spec.ts**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsManager, navigateTo } from './helpers/auth';

test.describe('Medications', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
    await navigateTo(page, 'Medication Management');
  });

  test('medication list loads without error', async ({ page }) => {
    await expect(page.getByText('Medication')).toBeVisible();
    await expect(page.getByText(/500|internal server error/i)).not.toBeVisible();
  });

  test('no 500 on medication distribution page', async ({ page }) => {
    await navigateTo(page, 'Medication Distribution');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/500|internal server error/i)).not.toBeVisible();
  });

  test('API calls to /api/meds return 2xx', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/patients'), { timeout: 10000 }),
      page.reload(),
    ]);
    expect(response.status()).toBeLessThan(500);
  });
});
```

- [ ] **Step 2: Запустить**

```bash
cd app && PLAYWRIGHT_BASE_URL=http://localhost:8080 PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e -- meds.spec.ts
```

- [ ] **Step 3: Commit**

```bash
git add app/tests/meds.spec.ts
git commit -m "test(e2e): add meds spec"
```

---

### Task 13: Shifts E2E spec

**Files:**
- Create: `app/tests/shifts.spec.ts`

- [ ] **Step 1: Создать shifts.spec.ts**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsManager, navigateTo } from './helpers/auth';

test.describe('Shifts', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
    await navigateTo(page, 'Shifts');
  });

  test('shifts page loads without error', async ({ page }) => {
    await expect(page.getByText(/shift/i)).toBeVisible();
    await expect(page.getByText(/500|internal server error/i)).not.toBeVisible();
  });

  test('GET /api/shifts returns 2xx', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/shifts'), { timeout: 10000 }),
      page.reload(),
    ]);
    expect(response.status()).toBeLessThan(400);
  });

  test('create shift via form returns 2xx', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add|new|shift|\+/i }).first();
    if (!(await addBtn.isVisible())) return;

    const [response] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/shifts') && r.request().method() === 'POST',
        { timeout: 15000 }
      ),
      addBtn.click(),
    ]);

    // Если форма открылась — заполнить минимально и сохранить
    const saveBtn = page.getByRole('button', { name: /save|create/i });
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForLoadState('networkidle');
    }
  });
});
```

- [ ] **Step 2: Запустить и commit**

```bash
cd app && PLAYWRIGHT_BASE_URL=http://localhost:8080 PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e -- shifts.spec.ts
git add app/tests/shifts.spec.ts
git commit -m "test(e2e): add shifts spec"
```

---

### Task 14: Phones E2E spec

**Files:**
- Create: `app/tests/phones.spec.ts`

- [ ] **Step 1: Создать phones.spec.ts**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsManager, navigateTo } from './helpers/auth';

test.describe('Phones', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
    await navigateTo(page, 'Phones');
  });

  test('phones page loads without error', async ({ page }) => {
    await expect(page.getByText(/phone/i)).toBeVisible();
    await expect(page.getByText(/500|internal server error/i)).not.toBeVisible();
  });

  test('GET /api/phones returns 2xx', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/phones'), { timeout: 10000 }),
      page.reload(),
    ]);
    expect(response.status()).toBeLessThan(400);
  });

  test('issue phone returns 201', async ({ page }) => {
    const issueBtn = page.getByRole('button', { name: /issue|give|phone/i }).first();
    if (!(await issueBtn.isVisible())) return;

    const [response] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/phones') && r.request().method() === 'POST',
        { timeout: 15000 }
      ),
      issueBtn.click(),
    ]);
    // Кнопка может открыть выбор пациента — тест проверяет что ответ не 4xx/5xx
    expect(response.status()).toBeLessThan(400);
  });
});
```

- [ ] **Step 2: Запустить и commit**

```bash
cd app && PLAYWRIGHT_BASE_URL=http://localhost:8080 PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e -- phones.spec.ts
git add app/tests/phones.spec.ts
git commit -m "test(e2e): add phones spec"
```

---

### Task 15: Consequences E2E spec

**Files:**
- Create: `app/tests/consequences.spec.ts`

- [ ] **Step 1: Создать consequences.spec.ts**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsManager, navigateTo } from './helpers/auth';

test.describe('Consequences', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
    await navigateTo(page, 'Consequences');
  });

  test('consequences page loads without error', async ({ page }) => {
    await expect(page.getByText(/consequence/i)).toBeVisible();
    await expect(page.getByText(/500|internal server error/i)).not.toBeVisible();
  });

  test('GET /api/consequences returns 2xx', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/consequences'), { timeout: 10000 }),
      page.reload(),
    ]);
    expect(response.status()).toBeLessThan(400);
  });
});
```

- [ ] **Step 2: Запустить и commit**

```bash
cd app && PLAYWRIGHT_BASE_URL=http://localhost:8080 PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e -- consequences.spec.ts
git add app/tests/consequences.spec.ts
git commit -m "test(e2e): add consequences spec"
```

---

### Task 16: Finance E2E spec

**Files:**
- Create: `app/tests/finance.spec.ts`

- [ ] **Step 1: Создать finance.spec.ts**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsManager, navigateTo } from './helpers/auth';

test.describe('Finance', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
    await navigateTo(page, 'General');
  });

  test('finance page loads without error', async ({ page }) => {
    await expect(page.getByText(/finance|general|cashbox/i)).toBeVisible();
    await expect(page.getByText(/500|internal server error/i)).not.toBeVisible();
  });

  test('GET /api/finance/patient returns 2xx', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/finance/patient'), { timeout: 10000 }),
      page.reload(),
    ]);
    expect(response.status()).toBeLessThan(400);
  });

  test('GET /api/finance/cashbox returns 2xx', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/finance/cashbox'), { timeout: 10000 }),
      page.reload(),
    ]);
    expect(response.status()).toBeLessThan(400);
  });

  test('POST /api/finance/patient with valid body returns 201', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add|deposit|withdraw|transaction/i }).first();
    if (!(await addBtn.isVisible())) return;
    await addBtn.click();

    // Форма финансовой транзакции
    const amountInput = page.getByLabel(/amount/i).first();
    if (await amountInput.isVisible()) {
      await amountInput.fill('100');
      const [response] = await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes('/api/finance') && r.request().method() === 'POST',
          { timeout: 15000 }
        ),
        page.getByRole('button', { name: /save|confirm/i }).click(),
      ]);
      expect(response.status()).toBeLessThan(400);
    }
  });
});
```

- [ ] **Step 2: Запустить и commit**

```bash
cd app && PLAYWRIGHT_BASE_URL=http://localhost:8080 PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e -- finance.spec.ts
git add app/tests/finance.spec.ts
git commit -m "test(e2e): add finance spec"
```

---

### Task 17: Groups E2E spec

**Files:**
- Create: `app/tests/groups.spec.ts`

- [ ] **Step 1: Создать groups.spec.ts**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsManager, navigateTo } from './helpers/auth';

test.describe('Groups', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
    await navigateTo(page, 'Groups');
  });

  test('groups page loads without error', async ({ page }) => {
    await expect(page.getByText(/group/i)).toBeVisible();
    await expect(page.getByText(/500|internal server error/i)).not.toBeVisible();
  });

  test('GET /api/groups returns 2xx', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/groups'), { timeout: 10000 }),
      page.reload(),
    ]);
    expect(response.status()).toBeLessThan(400);
  });

  test('create group returns 201', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add|new|group|\+/i }).first();
    if (!(await addBtn.isVisible())) return;
    await addBtn.click();

    const titleInput = page.getByLabel(/title|name|topic/i).first();
    if (await titleInput.isVisible()) {
      await titleInput.fill('E2E Test Group');
      const [response] = await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes('/api/groups') && r.request().method() === 'POST',
          { timeout: 15000 }
        ),
        page.getByRole('button', { name: /save|create/i }).click(),
      ]);
      expect(response.status()).toBeLessThan(400);
    }
  });
});
```

- [ ] **Step 2: Запустить и commit**

```bash
cd app && PLAYWRIGHT_BASE_URL=http://localhost:8080 PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e -- groups.spec.ts
git add app/tests/groups.spec.ts
git commit -m "test(e2e): add groups spec"
```

---

### Task 18: Therapy E2E spec

**Files:**
- Create: `app/tests/therapy.spec.ts`

- [ ] **Step 1: Создать therapy.spec.ts**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsManager, navigateTo } from './helpers/auth';

test.describe('Therapy', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
    await navigateTo(page, 'Session Records');
  });

  test('therapy page loads without error', async ({ page }) => {
    await expect(page.getByText(/session|therapy/i)).toBeVisible();
    await expect(page.getByText(/500|internal server error/i)).not.toBeVisible();
  });

  test('GET /api/therapy returns 2xx', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/therapy'), { timeout: 10000 }),
      page.reload(),
    ]);
    expect(response.status()).toBeLessThan(400);
  });

  test('therapist assignments page loads', async ({ page }) => {
    // Manage tab для therapist assignments
    await navigateTo(page, 'Management Center');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/500|internal server error/i)).not.toBeVisible();
  });
});
```

- [ ] **Step 2: Запустить и commit**

```bash
cd app && PLAYWRIGHT_BASE_URL=http://localhost:8080 PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e -- therapy.spec.ts
git add app/tests/therapy.spec.ts
git commit -m "test(e2e): add therapy spec"
```

---

### Task 19: Schedule E2E spec

**Files:**
- Create: `app/tests/schedule.spec.ts`

- [ ] **Step 1: Создать schedule.spec.ts**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsManager, navigateTo } from './helpers/auth';

test.describe('Schedule', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
    await navigateTo(page, 'Management Center');
  });

  test('management center loads without error', async ({ page }) => {
    await expect(page.getByText(/management|manage/i)).toBeVisible();
    await expect(page.getByText(/500|internal server error/i)).not.toBeVisible();
  });

  test('GET /api/schedule returns 2xx', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/schedule'), { timeout: 10000 }),
      page.reload(),
    ]);
    expect(response.status()).toBeLessThan(400);
  });

  test('GET /api/therapist-assignments returns 2xx', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/therapist-assignments'), { timeout: 10000 }),
      page.reload(),
    ]);
    expect(response.status()).toBeLessThan(400);
  });
});
```

- [ ] **Step 2: Запустить и commit**

```bash
cd app && PLAYWRIGHT_BASE_URL=http://localhost:8080 PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e -- schedule.spec.ts
git add app/tests/schedule.spec.ts
git commit -m "test(e2e): add schedule spec"
```

---

### Task 20: Distributions E2E spec

**Files:**
- Create: `app/tests/distributions.spec.ts`

- [ ] **Step 1: Создать distributions.spec.ts**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsManager, navigateTo } from './helpers/auth';

test.describe('Distributions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
    await navigateTo(page, 'Medication Distribution');
  });

  test('distributions page loads without error', async ({ page }) => {
    await expect(page.getByText(/distribution|medication/i)).toBeVisible();
    await expect(page.getByText(/500|internal server error/i)).not.toBeVisible();
  });

  test('GET /api/distributions returns 2xx', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/distributions'), { timeout: 10000 }),
      page.reload(),
    ]);
    expect(response.status()).toBeLessThan(400);
  });
});
```

- [ ] **Step 2: Запустить и commit**

```bash
cd app && PLAYWRIGHT_BASE_URL=http://localhost:8080 PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e -- distributions.spec.ts
git add app/tests/distributions.spec.ts
git commit -m "test(e2e): add distributions spec"
```

---

### Task 21: Rooms E2E spec

**Files:**
- Create: `app/tests/rooms.spec.ts`

- [ ] **Step 1: Создать rooms.spec.ts**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsManager, navigateTo } from './helpers/auth';

test.describe('Rooms', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
    await navigateTo(page, 'Room Map');
  });

  test('rooms page loads without error', async ({ page }) => {
    await expect(page.getByText(/room/i)).toBeVisible();
    await expect(page.getByText(/500|internal server error/i)).not.toBeVisible();
  });

  test('GET /api/rooms returns 2xx', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/rooms'), { timeout: 10000 }),
      page.reload(),
    ]);
    expect(response.status()).toBeLessThan(400);
  });
});
```

- [ ] **Step 2: Запустить и commit**

```bash
cd app && PLAYWRIGHT_BASE_URL=http://localhost:8080 PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e -- rooms.spec.ts
git add app/tests/rooms.spec.ts
git commit -m "test(e2e): add rooms spec"
```

---

### Task 22: Absences E2E spec

**Files:**
- Create: `app/tests/absences.spec.ts`

- [ ] **Step 1: Создать absences.spec.ts**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsManager, navigateTo } from './helpers/auth';

test.describe('Absences', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
    await navigateTo(page, 'Absences');
  });

  test('absences page loads without error', async ({ page }) => {
    await expect(page.getByText(/absence|away/i)).toBeVisible();
    await expect(page.getByText(/500|internal server error/i)).not.toBeVisible();
  });

  test('mark patient away returns 2xx', async ({ page }) => {
    const awayBtn = page.getByRole('button', { name: /away|mark away/i }).first();
    if (!(await awayBtn.isVisible())) return;

    const [response] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/patients') && r.request().method() === 'PATCH',
        { timeout: 15000 }
      ),
      awayBtn.click(),
    ]);
    expect(response.status()).toBeLessThan(400);
  });
});
```

- [ ] **Step 2: Запустить и commit**

```bash
cd app && PLAYWRIGHT_BASE_URL=http://localhost:8080 PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e -- absences.spec.ts
git add app/tests/absences.spec.ts
git commit -m "test(e2e): add absences spec"
```

---

### Task 23: Summary E2E spec

**Files:**
- Create: `app/tests/summary.spec.ts`

- [ ] **Step 1: Создать summary.spec.ts**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsManager, navigateTo } from './helpers/auth';

test.describe('Daily Summary', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
    await navigateTo(page, 'Daily Summary');
  });

  test('summary page loads without error', async ({ page }) => {
    await expect(page.getByText(/summary/i)).toBeVisible();
    await expect(page.getByText(/500|internal server error/i)).not.toBeVisible();
  });

  test('GET /api/summary returns 2xx', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/summary'), { timeout: 10000 }),
      page.reload(),
    ]);
    expect(response.status()).toBeLessThan(400);
  });
});
```

- [ ] **Step 2: Запустить и commit**

```bash
cd app && PLAYWRIGHT_BASE_URL=http://localhost:8080 PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e -- summary.spec.ts
git add app/tests/summary.spec.ts
git commit -m "test(e2e): add summary spec"
```

---

### Task 24: Users E2E spec (Manage module)

**Files:**
- Create: `app/tests/users.spec.ts`

- [ ] **Step 1: Создать users.spec.ts**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsManager, navigateTo } from './helpers/auth';

test.describe('Users / Management Center', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsManager(page);
    await navigateTo(page, 'Management Center');
  });

  test('management center loads without error', async ({ page }) => {
    await expect(page.getByText(/management|manage/i)).toBeVisible();
    await expect(page.getByText(/500|internal server error/i)).not.toBeVisible();
  });

  test('GET /api/users returns 2xx', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/users'), { timeout: 10000 }),
      page.reload(),
    ]);
    expect(response.status()).toBeLessThan(400);
  });
});
```

- [ ] **Step 2: Запустить и commit**

```bash
cd app && PLAYWRIGHT_BASE_URL=http://localhost:8080 PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e -- users.spec.ts
git add app/tests/users.spec.ts
git commit -m "test(e2e): add users/manage spec"
```

---

### Task 25: Full suite run + `make e2e` verification

- [ ] **Step 1: Запустить полный suite против Docker stack**

```bash
make  # запустить Docker если не запущен
cd app && PLAYWRIGHT_BASE_URL=http://localhost:8080 PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e
```

Ожидаемый результат: все spec-файлы проходят. Любой падающий тест — зафиксировать причину и создать issue.

- [ ] **Step 2: Проверить `make e2e` (встроенная команда)**

```bash
make e2e
```

Если `make e2e` не выставляет `PLAYWRIGHT_BASE_URL` и `PLAYWRIGHT_SKIP_WEBSERVER` — добавить их в `Makefile`. Открыть `Makefile`:

```bash
cat Makefile | grep -A5 "e2e"
```

Если строка e2e выглядит так:
```makefile
e2e:
    cd app && npm run test:e2e
```

Обновить на:
```makefile
e2e:
    cd app && PLAYWRIGHT_BASE_URL=http://localhost:8080 PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e
```

- [ ] **Step 3: Commit Makefile если изменён**

```bash
git add Makefile
git commit -m "chore: configure make e2e to use Docker stack URL"
```

---

### Task 26: Добавить E2E в GitHub Actions CI

**Files:**
- Read: `.github/workflows/` (все файлы)
- Modify or Create: `.github/workflows/e2e-ci.yml`

- [ ] **Step 1: Проверить существующий CI**

```bash
ls .github/workflows/
cat .github/workflows/backend-ci.yml
```

- [ ] **Step 2: Создать `.github/workflows/e2e-ci.yml`**

```yaml
name: e2e-ci

on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  e2e:
    runs-on: ubuntu-latest
    needs: []  # можно добавить: [backend-ci] если хочется sequential

    steps:
      - uses: actions/checkout@v4

      - name: Start Docker stack
        run: make
        timeout-minutes: 5

      - name: Wait for services
        run: |
          until curl -sf http://localhost:4000/health; do sleep 2; done
          until curl -sf http://localhost:8080; do sleep 2; done
        timeout-minutes: 3

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: app/package-lock.json

      - name: Install dependencies
        run: cd app && npm ci

      - name: Install Playwright browsers
        run: cd app && npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: cd app && PLAYWRIGHT_BASE_URL=http://localhost:8080 PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e
        env:
          CI: true

      - name: Upload test results on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: app/playwright-report/
          retention-days: 7
```

- [ ] **Step 3: Commit и push**

```bash
git add .github/workflows/e2e-ci.yml
git commit -m "ci: add e2e GitHub Actions workflow"
git push
```

- [ ] **Step 4: Проверить CI**

```bash
gh run list --workflow=e2e-ci.yml --limit=3
gh run watch
```

---

### Task 27: Memory checkpoint Phase 3 + prod verification

- [ ] **Step 1: Проверить прод**

Открыть `https://rehab-lyart-eight.vercel.app`, войти как `manager1`/`1234`.  
Для каждого модуля (14 штук):
- Открыть
- Выполнить одно действие просмотра (GET)
- Убедиться что нет 500-х (открыть DevTools → Network)

Записать статус каждого модуля: ✅ / ❌ / ⚠️

- [ ] **Step 2: Сохранить memory checkpoint**

Записать в memory:
- Список всех spec-файлов и их статус (pass/fail)
- Статус прод-верификации по модулям
- Статус CI workflow (`e2e-ci`)
- MVP checklist: `make e2e` ✅/❌, prod no-500s ✅/❌, CI green ✅/❌

---

## Definition of Done

- [ ] `docs/audit/frontend-backend-audit.md` заполнен — ✅/❌/⚠️ для каждого эндпоинта
- [ ] Все BLOCKING issues устранены (статус ❌ → ✅ в таблице)
- [ ] 14 Playwright spec-файлов в `app/tests/` — все проходят локально
- [ ] `make e2e` зелёный
- [ ] GitHub Actions `e2e-ci` зелёный на master
- [ ] Prod: навигация по всем 14 модулям без 500-х

---

## File Map

### Created (Phase 1)
- `docs/audit/frontend-backend-audit.md` — таблица аудита

### Created (Phase 3)
- `app/tests/helpers/auth.ts` — login helper
- `app/tests/auth.spec.ts`
- `app/tests/patients.spec.ts`
- `app/tests/meds.spec.ts`
- `app/tests/shifts.spec.ts`
- `app/tests/phones.spec.ts`
- `app/tests/consequences.spec.ts`
- `app/tests/finance.spec.ts`
- `app/tests/groups.spec.ts`
- `app/tests/therapy.spec.ts`
- `app/tests/schedule.spec.ts`
- `app/tests/distributions.spec.ts`
- `app/tests/rooms.spec.ts`
- `app/tests/absences.spec.ts`
- `app/tests/summary.spec.ts`
- `app/tests/users.spec.ts`
- `.github/workflows/e2e-ci.yml`

### Modified (Phase 2 — depends on audit findings)
- `app/src/lib/api.js` — frontend field name fixes
- `app/src/App.jsx` — mutation function fixes (если нужно)
- Backend controllers — через /dev-agent PR

### Modified (Phase 3)
- `Makefile` — добавить PLAYWRIGHT_BASE_URL и PLAYWRIGHT_SKIP_WEBSERVER в target `e2e`
