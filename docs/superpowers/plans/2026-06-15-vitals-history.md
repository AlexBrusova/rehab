# Vitals History Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new "Vitals" tab to the patient profile (`PatientProfile.jsx`) showing an append-only history of blood-pressure/pulse records, matching the AppEn reference screenshot ("138/90 | Pulse 80" + note + date).

**Architecture:** New `Vital` Prisma model + JPA entity/repo/controller (mirrors `Finance`/`Consequence`, no service layer). `GET /api/vitals?houseId=` returns history newest-first; `POST /api/vitals` appends a record (no edit/delete). Frontend: new tab in `PatientProfile.jsx`, visible to `org_manager`/`manager`/`doctor`/`therapist` (hidden for `counselor`); "+ Add Vitals" form visible only to `doctor`/`therapist`.

**Tech Stack:** Kotlin/Spring Boot (JPA, Testcontainers IT), Prisma schema, React (Vite), i18n (`en.js`/`he.js`), Playwright E2E.

---

### Task 1: Prisma schema

**Files:**
- Modify: `db/prisma/schema.prisma`

- [ ] **Step 1: Add `Vital` model**

Add after the `Finance` model (currently ends at line 165, right before `model CashboxEntry`):

```prisma
model Vital {
  id        String   @id @default(cuid())
  patientId String
  houseId   String
  systolic  Int
  diastolic Int
  pulse     Int
  note      String   @default("")
  date      String

  patient Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)
  house   House   @relation(fields: [houseId], references: [id])

  createdAt DateTime @default(now())

  @@index([patientId])
  @@index([houseId])
}
```

- [ ] **Step 2: Add inverse relation on `Patient`**

In `model Patient` (around line 88-89), add `vitals` alongside the existing relation arrays:

```prisma
  finances          Finance[]
  consequences      Consequence[]
  vitals            Vital[]
```

- [ ] **Step 3: Add inverse relation on `House`**

`Consequence` already has `house House @relation(...)`, so `House` must already have a `consequences Consequence[]` field. Find it and add `vitals Vital[]` next to it:

```bash
grep -n "consequences" db/prisma/schema.prisma
```

Add `vitals Vital[]` immediately after the `House` model's `consequences Consequence[]` line.

- [ ] **Step 4: Commit**

```bash
git add db/prisma/schema.prisma
git commit -m "feat: add Vital model to Prisma schema"
```

---

### Task 2: Backend validation constants

**Files:**
- Modify: `backend/src/main/kotlin/com/rehabcenter/validation/UiValidation.kt`
- Modify: `backend/src/main/kotlin/com/rehabcenter/validation/FieldRulesRegistry.kt`

- [ ] **Step 1: Add vital value range constants**

In `UiValidation.kt`, add after `const val CONSEQUENCE_TYPE_MAX = 64` (line 28):

```kotlin
    const val VITAL_VALUE_MIN = 0
    const val VITAL_VALUE_MAX = 300
```

- [ ] **Step 2: Add `vital` entry to `FieldRulesRegistry`**

In `FieldRulesRegistry.kt`, add the imports:

```kotlin
import com.rehabcenter.validation.UiValidation.VITAL_VALUE_MAX
import com.rehabcenter.validation.UiValidation.VITAL_VALUE_MIN
```

Add a new map entry after `"finance"` (after line 144, before `"therapySession"`):

```kotlin
        "vital" to mapOf(
            "systolic" to FieldConstraints(required = true, min = VITAL_VALUE_MIN, max = VITAL_VALUE_MAX),
            "diastolic" to FieldConstraints(required = true, min = VITAL_VALUE_MIN, max = VITAL_VALUE_MAX),
            "pulse" to FieldConstraints(required = true, min = VITAL_VALUE_MIN, max = VITAL_VALUE_MAX),
            "note" to FieldConstraints(maxLength = NOTE_MAX),
            "date" to FieldConstraints(required = true, maxLength = DATE_UI_MAX),
        ),
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/kotlin/com/rehabcenter/validation/UiValidation.kt backend/src/main/kotlin/com/rehabcenter/validation/FieldRulesRegistry.kt
git commit -m "feat: add vital field validation constants"
```

---

### Task 3: Backend entity, repository, controller

**Files:**
- Create: `backend/src/main/kotlin/com/rehabcenter/domain/Vital.kt`
- Create: `backend/src/main/kotlin/com/rehabcenter/repo/VitalRepository.kt`
- Create: `backend/src/main/kotlin/com/rehabcenter/web/VitalController.kt`

- [ ] **Step 1: Create the JPA entity**

`backend/src/main/kotlin/com/rehabcenter/domain/Vital.kt`:

```kotlin
package com.rehabcenter.domain

import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "Vital")
@JsonIgnoreProperties(ignoreUnknown = true)
class Vital(
    @Id
    var id: String = "",
    @Column(nullable = false)
    var patientId: String = "",
    @Column(nullable = false)
    var houseId: String = "",
    @Column(nullable = false)
    var systolic: Int = 0,
    @Column(nullable = false)
    var diastolic: Int = 0,
    @Column(nullable = false)
    var pulse: Int = 0,
    @Column(nullable = false)
    var note: String = "",
    @Column(nullable = false)
    var date: String = "",
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patientId", insertable = false, updatable = false)
    @JsonIgnore
    var patient: Patient? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "houseId", insertable = false, updatable = false)
    @JsonIgnore
    var house: House? = null,
    @Column(nullable = false)
    var createdAt: Instant = Instant.now(),
)
```

- [ ] **Step 2: Create the repository**

`backend/src/main/kotlin/com/rehabcenter/repo/VitalRepository.kt`:

```kotlin
package com.rehabcenter.repo

import com.rehabcenter.domain.Vital
import org.springframework.data.jpa.repository.JpaRepository

interface VitalRepository : JpaRepository<Vital, String> {
    fun findByHouseIdOrderByDateDescCreatedAtDesc(houseId: String): List<Vital>
    fun findByPatientIdOrderByDateDescCreatedAtDesc(patientId: String): List<Vital>
}
```

- [ ] **Step 3: Create the controller**

`backend/src/main/kotlin/com/rehabcenter/web/VitalController.kt`:

```kotlin
package com.rehabcenter.web

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.rehabcenter.domain.Vital
import com.rehabcenter.repo.VitalRepository
import com.rehabcenter.validation.UiValidation
import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.util.UUID

@Validated
@RestController
@RequestMapping("/api/vitals")
class VitalController(
    private val vitals: VitalRepository,
) {
    @GetMapping
    fun list(
        @RequestParam @NotBlank @Size(max = UiValidation.ID_MAX) houseId: String,
    ): ResponseEntity<Any> =
        ResponseEntity.ok(vitals.findByHouseIdOrderByDateDescCreatedAtDesc(houseId))

    @JsonIgnoreProperties(ignoreUnknown = true)
    data class CreateVitalBody(
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val patientId: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val houseId: String? = null,
        @field:NotNull @field:Min(UiValidation.VITAL_VALUE_MIN.toLong()) @field:Max(UiValidation.VITAL_VALUE_MAX.toLong())
        val systolic: Int? = null,
        @field:NotNull @field:Min(UiValidation.VITAL_VALUE_MIN.toLong()) @field:Max(UiValidation.VITAL_VALUE_MAX.toLong())
        val diastolic: Int? = null,
        @field:NotNull @field:Min(UiValidation.VITAL_VALUE_MIN.toLong()) @field:Max(UiValidation.VITAL_VALUE_MAX.toLong())
        val pulse: Int? = null,
        @field:Size(max = UiValidation.NOTE_MAX)
        val note: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.DATE_UI_MAX)
        val date: String? = null,
    )

    @Transactional
    @PostMapping
    fun create(@RequestBody @Valid body: CreateVitalBody): ResponseEntity<Any> {
        val v =
            Vital(
                id = UUID.randomUUID().toString(),
                patientId = body.patientId!!,
                houseId = body.houseId!!,
                systolic = body.systolic!!,
                diastolic = body.diastolic!!,
                pulse = body.pulse!!,
                note = body.note ?: "",
                date = body.date!!,
                createdAt = Instant.now(),
            )
        return ResponseEntity.status(201).body(vitals.save(v))
    }
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/kotlin/com/rehabcenter/domain/Vital.kt backend/src/main/kotlin/com/rehabcenter/repo/VitalRepository.kt backend/src/main/kotlin/com/rehabcenter/web/VitalController.kt
git commit -m "feat: add Vital entity, repository, and controller"
```

---

### Task 4: Wire VitalRepository into test fixtures

**Files:**
- Modify: `backend/src/test/kotlin/com/rehabcenter/testsupport/TestSupportConfig.kt`

- [ ] **Step 1: Add `VitalRepository` to the fixture bean and class**

In `TestSupportConfig.kt`:

1. Add the import:
```kotlin
import com.rehabcenter.repo.VitalRepository
```

2. Add `vitals: VitalRepository` as a parameter to `integrationTestFixture(...)` (after `finances: FinanceRepository,`), and pass it through to `IntegrationTestFixture(...)`.

3. Add `private val vitals: VitalRepository,` as a constructor parameter to `IntegrationTestFixture` (same position, after `finances`).

4. In `resetAndSeed()`, add `vitals.deleteAll()` before `finances.deleteAll()` (vitals reference patients via FK, must be deleted before `patients.deleteAll()`):

```kotlin
            vitals.deleteAll()
            finances.deleteAll()
```

- [ ] **Step 2: Verify the project compiles**

Run from `backend/`:

```bash
./gradlew compileTestKotlin
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 3: Commit**

```bash
git add backend/src/test/kotlin/com/rehabcenter/testsupport/TestSupportConfig.kt
git commit -m "test: wire VitalRepository into integration test fixture"
```

---

### Task 5: Backend integration tests

**Files:**
- Create: `backend/src/test/kotlin/com/rehabcenter/it/VitalIT.kt`

- [ ] **Step 1: Write the integration test**

`backend/src/test/kotlin/com/rehabcenter/it/VitalIT.kt`:

```kotlin
package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import com.rehabcenter.testsupport.bearerHeaders
import com.rehabcenter.testsupport.obtainToken
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod

class VitalIT : AbstractIntegrationTest() {

    private fun doctorToken() = rest.obtainToken("doctor1", "1234")

    private fun validCreateBody(): Map<String, Any?> = mapOf(
        "patientId" to "p1",
        "houseId" to "h1",
        "systolic" to 138,
        "diastolic" to 90,
        "pulse" to 80,
        "note" to "Borderline pressure - monitor",
        "date" to "01/01/2025",
    )

    @Test
    fun `POST vitals creates a vital record with all fields`() {
        val token = doctorToken()
        val res = rest.exchange(
            "/api/vitals",
            HttpMethod.POST,
            HttpEntity(validCreateBody(), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
        assertThat(res.body!!["systolic"]).isEqualTo(138)
        assertThat(res.body!!["diastolic"]).isEqualTo(90)
        assertThat(res.body!!["pulse"]).isEqualTo(80)
        assertThat(res.body!!["note"]).isEqualTo("Borderline pressure - monitor")
    }

    @Test
    fun `POST vitals ignores unknown extra fields and returns 201`() {
        val token = doctorToken()
        val body = validCreateBody() + mapOf(
            "id" to "some-id",
            "createdAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/vitals",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
    }

    @Test
    fun `POST vitals returns 400 when systolic is missing`() {
        val token = doctorToken()
        val body = validCreateBody() - "systolic"
        val res = rest.exchange(
            "/api/vitals",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
    }

    @Test
    fun `POST vitals returns 400 when pulse is out of range`() {
        val token = doctorToken()
        val body = validCreateBody() + mapOf("pulse" to 500)
        val res = rest.exchange(
            "/api/vitals",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
    }

    @Test
    fun `GET vitals returns created record ordered newest first`() {
        val token = doctorToken()
        rest.exchange(
            "/api/vitals",
            HttpMethod.POST,
            HttpEntity(validCreateBody(), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        rest.exchange(
            "/api/vitals",
            HttpMethod.POST,
            HttpEntity(validCreateBody() + mapOf("date" to "02/01/2025"), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        val res = rest.exchange(
            "/api/vitals?houseId=h1",
            HttpMethod.GET,
            HttpEntity<Void>(bearerHeaders(token)),
            object : ParameterizedTypeReference<List<Map<String, Any?>>>() {},
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        val dates = res.body!!.map { it["date"] }
        assertThat(dates.first()).isEqualTo("02/01/2025")
    }

    @Test
    fun `GET vitals requires houseId`() {
        val token = doctorToken()
        val res = rest.exchange(
            "/api/vitals",
            HttpMethod.GET,
            HttpEntity<Void>(bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
    }
}
```

- [ ] **Step 2: Run the tests**

Run from `backend/`:

```bash
./gradlew test --tests "com.rehabcenter.it.VitalIT"
```

Expected: PASS (6 tests). If Docker/Testcontainers is unavailable, tests are skipped — note this in the final report.

- [ ] **Step 3: Run full backend check**

```bash
./gradlew check
```

Expected: BUILD SUCCESSFUL (lint + all tests).

- [ ] **Step 4: Commit**

```bash
git add backend/src/test/kotlin/com/rehabcenter/it/VitalIT.kt
git commit -m "test: add integration tests for Vital endpoints"
```

---

### Task 6: Frontend validation limits and sanitizer

**Files:**
- Modify: `app/src/data/validationLimits.js`
- Modify: `app/src/lib/inputSanitize.js`

- [ ] **Step 1: Add vital value constants**

In `validationLimits.js`, add to the `V` object after `ROOM_CAPACITY_MAX: 50,` (line 23):

```javascript
  VITAL_VALUE_MIN: 0,
  VITAL_VALUE_MAX: 300,
```

- [ ] **Step 2: Add a sanitizer for vital number inputs**

In `inputSanitize.js`, add after `sanitizeRoomCapacity` (the function ending around line 107-109), following the same clamp pattern but importing `V.VITAL_VALUE_MIN`/`V.VITAL_VALUE_MAX`:

```javascript
/** Числовое поле vitals (давление/пульс): 0–300. */
export function sanitizeVitalNumber(s) {
  const d = String(s ?? "").replace(/\D/g, "");
  if (!d) return "";
  let n = parseInt(d, 10);
  if (Number.isNaN(n)) return "";
  n = Math.min(V.VITAL_VALUE_MAX, Math.max(V.VITAL_VALUE_MIN, n));
  return String(n);
}
```

(Check the top of `inputSanitize.js` — it already imports `V` from `../data/validationLimits` for `sanitizeRoomCapacity`; reuse that import.)

- [ ] **Step 3: Lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/src/data/validationLimits.js app/src/lib/inputSanitize.js
git commit -m "feat: add vital value limits and sanitizer"
```

---

### Task 7: i18n keys

**Files:**
- Modify: `app/src/i18n/en.js`
- Modify: `app/src/i18n/he.js`

- [ ] **Step 1: Add keys to `en.js`**

In the `patientProfile` namespace, add `vitalsTab` right after `moodsTab: "😊 Indicators",` (line 179):

```javascript
    vitalsTab: "🩺 Vitals",
```

Add the remaining new keys right before the closing `},` of `patientProfile` (after `toastReturnFailed: "❌ Failed to update patient",`, line 222):

```javascript
    addVitalsButton: "+ Add Vitals",
    systolicPlaceholder: "Systolic",
    diastolicPlaceholder: "Diastolic",
    pulsePlaceholder: "Pulse",
    pulseLabel: "Pulse",
    vitalNotePlaceholder: "Note (optional)",
    noVitalRecords: "No vital records for this patient",
    toastFillVitalsRequired: "⚠️ Please fill Systolic, Diastolic, and Pulse",
    toastVitalAddSuccess: "✅ Vitals recorded",
    toastVitalAddFailed: "❌ Failed to record vitals",
```

- [ ] **Step 2: Add keys to `he.js`**

`he.js`'s `patientProfile` namespace is a single-line object (line 9). Add `vitalsTab` right after `moodsTab: "😊 מדדים",`:

```javascript
vitalsTab: "🩺 מדדים רפואיים",
```

Add the remaining keys right before the final closing `}` of the `patientProfile` object (after `toastReturnFailed: "❌ נכשל עדכון המטופל"`):

```javascript
, addVitalsButton: "+ הוספת מדדים", systolicPlaceholder: "סיסטולי", diastolicPlaceholder: "דיאסטולי", pulsePlaceholder: "פעימות", pulseLabel: "פעימות", vitalNotePlaceholder: "הערה (אופציונלי)", noVitalRecords: "אין רישומי מדדים למטופל זה", toastFillVitalsRequired: "⚠️ יש למלא סיסטולי, דיאסטולי ופעימות", toastVitalAddSuccess: "✅ המדדים נשמרו", toastVitalAddFailed: "❌ נכשל שמירת המדדים"
```

- [ ] **Step 3: Lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/src/i18n/en.js app/src/i18n/he.js
git commit -m "feat: add i18n keys for vitals tab"
```

---

### Task 8: App.jsx data wiring

**Files:**
- Modify: `app/src/App.jsx`

- [ ] **Step 1: Add `vitals` state**

After `const [finance, setFinance] = useState([]);` (line 56):

```javascript
  const [vitals, setVitals] = useState([]);
```

- [ ] **Step 2: Load vitals on house change**

After the `/api/finance/patient` load block (lines 140-142):

```javascript
    authFetch(`/api/vitals?houseId=${activeHouseId}`)
      .then(setVitals)
      .catch(console.error);
```

- [ ] **Step 3: Add `houseVitals` derived list**

After `const houseFinance = finance.filter((f) => housePatientIds.has(f.patientId));` (line 521):

```javascript
  const houseVitals = vitals.filter((v) => housePatientIds.has(v.patientId));
```

- [ ] **Step 4: Add `createVital` handler**

After `createPatientTx` (ends at line 387, right before `createCashTx`):

```javascript
  const createVital = async (patientId, houseId, { systolic, diastolic, pulse, note }) => {
    const date = new Date().toLocaleDateString("en-GB");
    const created = await authFetch("/api/vitals", {
      method: "POST",
      body: JSON.stringify({
        patientId,
        houseId,
        systolic: Number(systolic),
        diastolic: Number(diastolic),
        pulse: Number(pulse),
        note: note || "",
        date,
      }),
    });
    setVitals((prev) => [created, ...prev]);
    return created;
  };
```

- [ ] **Step 5: Pass `vitals` and `onAddVital` to `Patients`**

In the `patients:` screen element (around line 546-571), add two new props next to `finance={houseFinance}` (line 560):

```javascript
          finance={houseFinance}
          vitals={houseVitals}
          onAddVital={createVital}
```

- [ ] **Step 6: Lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add app/src/App.jsx
git commit -m "feat: load and provide vitals data to Patients screen"
```

---

### Task 9: Patients.jsx pass-through

**Files:**
- Modify: `app/src/pages/Patients.jsx`

- [ ] **Step 1: Accept and forward `vitals`/`onAddVital`**

Add `vitals` and `onAddVital` to the destructured props (after `finance,` at line 28):

```javascript
  finance,
  vitals,
  onAddVital,
```

Pass them to `PatientProfile` (after `finance={finance}` at line 278):

```javascript
          finance={finance}
          vitals={vitals}
          onAddVital={onAddVital}
```

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/Patients.jsx
git commit -m "feat: pass vitals data through to PatientProfile"
```

---

### Task 10: Vitals tab UI in PatientProfile.jsx

**Files:**
- Modify: `app/src/pages/PatientProfile.jsx`

- [ ] **Step 1: Import `FTA` and the sanitizer**

Update the `ui` import (line 8) to include `FTA`:

```javascript
import { Badge, Card, CT, Alrt, Btn, Modal, FL, FI, FS, FTA } from "../components/ui";
```

Update the `inputSanitize` import (lines 4-7) to include `sanitizeVitalNumber`:

```javascript
import {
  sanitizeMedDose,
  sanitizeMedName,
  sanitizeVitalNumber,
} from "../lib/inputSanitize";
```

- [ ] **Step 2: Accept new props**

Add `vitals = []` and `onAddVital` to the component's props (after `finance,` at line 23):

```javascript
  finance,
  vitals = [],
  onAddVital,
```

- [ ] **Step 3: Add tab state and derived list**

After `const pTherapy = therapy.filter((th) => th.patientId === pid);` (line 49), add:

```javascript
  const pVitals = vitals.filter((v) => v.patientId === pid);
  const canAddVital = user.role === "doctor" || user.role === "therapist";
```

After the `[showAbsence, setShowAbsence]` / `[absData, setAbsData]` state declarations (lines 41-42), add:

```javascript
  const [showAddVital, setShowAddVital] = useState(false);
  const [newVital, setNewVital] = useState({ systolic: "", diastolic: "", pulse: "", note: "" });
```

- [ ] **Step 4: Add the `addVital` handler**

After the `addMed` function (ends at line 75, right before `openAbsence`):

```javascript
  const addVital = async () => {
    if (!newVital.systolic || !newVital.diastolic || !newVital.pulse) {
      toast(t('patientProfile.toastFillVitalsRequired'));
      return;
    }
    try {
      await onAddVital(pid, p.houseId, newVital);
      setNewVital({ systolic: "", diastolic: "", pulse: "", note: "" });
      setShowAddVital(false);
      toast(t('patientProfile.toastVitalAddSuccess'));
    } catch { toast(t('patientProfile.toastVitalAddFailed')); }
  };
```

- [ ] **Step 5: Add the tab to the tab bar, hidden for counselors**

Replace the tabs array (lines 168-176):

```javascript
        {[
          ["meds", t('patientProfile.medicationsTab')],
          ["absence", t('patientProfile.absencesTab')],
          ["cons", t('patientProfile.consequencesTab')],
          ["finance", t('patientProfile.financeTab')],
          ...(user.role !== "counselor" ? [["vitals", t('patientProfile.vitalsTab')]] : []),
          ["moods", t('patientProfile.moodsTab')],
          ["therapy", t('patientProfile.therapyTab')],
          ["notes", t('patientProfile.notesTab')],
        ].map(([id, l]) => (
```

- [ ] **Step 6: Add the VITALS TAB content block**

Insert between the FINANCE TAB block (ends at line 346) and the MOODS TAB block (starts at line 348-349):

```javascript
      {/* VITALS TAB */}
      {tab === "vitals" && (
        <div>
          {canAddVital && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
              <Btn color="teal" size="sm" onClick={() => setShowAddVital(true)}>{t('patientProfile.addVitalsButton')}</Btn>
            </div>
          )}
          {showAddVital && (
            <div style={{ background: "#f0fafa", borderRadius: 10, border: `2px solid ${C.teal}`, padding: 14, marginBottom: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                <FI
                  value={newVital.systolic}
                  onChange={(v) => setNewVital((m) => ({ ...m, systolic: v }))}
                  placeholder={t('patientProfile.systolicPlaceholder')}
                  type="number"
                  sanitize={sanitizeVitalNumber}
                  dir={dir}
                />
                <FI
                  value={newVital.diastolic}
                  onChange={(v) => setNewVital((m) => ({ ...m, diastolic: v }))}
                  placeholder={t('patientProfile.diastolicPlaceholder')}
                  type="number"
                  sanitize={sanitizeVitalNumber}
                  dir={dir}
                />
                <FI
                  value={newVital.pulse}
                  onChange={(v) => setNewVital((m) => ({ ...m, pulse: v }))}
                  placeholder={t('patientProfile.pulsePlaceholder')}
                  type="number"
                  sanitize={sanitizeVitalNumber}
                  dir={dir}
                />
              </div>
              <FTA
                value={newVital.note}
                onChange={(v) => setNewVital((m) => ({ ...m, note: v }))}
                placeholder={t('patientProfile.vitalNotePlaceholder')}
                maxLength={V.NOTE_MAX}
                rows={2}
                dir={dir}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <Btn color="teal" size="sm" onClick={addVital}>{t('patientProfile.addButton')}</Btn>
                <Btn color="outline" size="sm" onClick={() => setShowAddVital(false)}>{t('patientProfile.cancelButton')}</Btn>
              </div>
            </div>
          )}
          {pVitals.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20, color: C.soft, fontSize: 13 }}>{t('patientProfile.noVitalRecords')}</div>
          ) : (
            pVitals.map((v) => (
              <div key={v.id} style={{ display: "flex", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.border}`, gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    {v.systolic}/{v.diastolic} | {t('patientProfile.pulseLabel')} {v.pulse}
                  </div>
                  {v.note && (
                    <div style={{ fontSize: 12, color: C.mid, marginTop: 2 }}>{v.note}</div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: C.soft }}>{v.date}</div>
              </div>
            ))
          )}
        </div>
      )}

```

- [ ] **Step 7: Lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 8: Manual smoke test**

Run from `app/` (with the API running on `:4000`):

```bash
npm run dev
```

Log in as `doctor1` / `1234`, open a patient profile, go to the "🩺 Vitals" tab:
- Empty state shows "No vital records for this patient".
- Click "+ Add Vitals", fill Systolic/Diastolic/Pulse (note optional), submit — new record appears at the top with format `138/90 | Pulse 80` and the note below it.
- Submitting with empty Systolic/Diastolic/Pulse shows the "Please fill..." toast and does not create a record.

Log in as `manager1` / `1234`, open the same patient — Vitals tab visible, history shows the new record, no "+ Add Vitals" button.

Log in as `counselor1` / `1234`, open a patient profile — no "Vitals" tab in the tab bar.

- [ ] **Step 9: Commit**

```bash
git add app/src/pages/PatientProfile.jsx
git commit -m "feat: add vitals history tab to patient profile"
```

---

### Task 11: E2E tests

**Files:**
- Create: `app/e2e/vitals.spec.ts`

- [ ] **Step 1: Write the E2E test**

`app/e2e/vitals.spec.ts`:

```typescript
import { expect, test } from "@playwright/test";
import { goToScreen, loginAsCounselor, loginAsDoctor, loginAsManager } from "./helpers";

test.describe("Vitals history tab", () => {
  test("doctor adds a vitals record and manager sees it", async ({ page }) => {
    await loginAsDoctor(page);
    await goToScreen(page, "patients");
    await page.locator("table tbody tr").first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("dialog").getByText("🩺 Vitals", { exact: true }).click();
    await page.getByRole("button", { name: "+ Add Vitals" }).click();

    await page.getByPlaceholder("Systolic").fill("138");
    await page.getByPlaceholder("Diastolic").fill("90");
    await page.getByPlaceholder("Pulse").fill("80");
    await page.getByPlaceholder("Note (optional)").fill("Borderline pressure - monitor");

    const post = page.waitForResponse(
      (r) => r.url().includes("/api/vitals") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "✓ Add" }).click();
    await post;

    await expect(page.getByText("138/90 | Pulse 80")).toBeVisible();
    await expect(page.getByText("Borderline pressure - monitor")).toBeVisible();
    await page.getByRole("dialog").getByText("✕", { exact: true }).first().click();

    await loginAsManager(page);
    await goToScreen(page, "patients");
    await page.locator("table tbody tr").first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("dialog").getByText("🩺 Vitals", { exact: true }).click();

    await expect(page.getByText("138/90 | Pulse 80")).toBeVisible();
    await expect(page.getByRole("button", { name: "+ Add Vitals" })).not.toBeVisible();
  });

  test("vitals add form requires systolic, diastolic, and pulse", async ({ page }) => {
    await loginAsDoctor(page);
    await goToScreen(page, "patients");
    await page.locator("table tbody tr").first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("dialog").getByText("🩺 Vitals", { exact: true }).click();
    await page.getByRole("button", { name: "+ Add Vitals" }).click();
    await page.getByRole("button", { name: "✓ Add" }).click();

    await expect(page.getByTestId("toast")).toContainText("Please fill Systolic, Diastolic, and Pulse");
  });

  test("counselor does not see the Vitals tab", async ({ page }) => {
    await loginAsCounselor(page);
    await goToScreen(page, "patients");
    await page.locator("table tbody tr").first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });

    await expect(page.getByRole("dialog").getByText("🩺 Vitals", { exact: true })).not.toBeVisible();
  });
});
```

- [ ] **Step 2: Run the E2E tests**

From `app/`, with the API running on `:4000`:

```bash
npm run test:e2e -- vitals.spec.ts
```

Expected: PASS (3 tests). If Docker/the API stack isn't available in this environment, this step is skipped — note that in the final report.

- [ ] **Step 3: Commit**

```bash
git add app/e2e/vitals.spec.ts
git commit -m "test: e2e coverage for vitals history tab"
```

---

### Task 12: Local DB migration (manual, dev-only)

**Files:** none (operational step)

- [ ] **Step 1: Apply the Prisma schema change to the local dev DB**

From `db/`:

```bash
npx prisma migrate dev --name add_vital
```

This generates a migration under `db/prisma/migrations/` and applies it. Required because `backend/src/main/resources/application.yml` uses `ddl-auto: validate` for local `bootRun` — Hibernate will refuse to start if the `Vital` table doesn't exist. (Docker/test profiles use `ddl-auto: update`/`create-drop` and auto-create the table.)

- [ ] **Step 2: Commit the generated migration**

```bash
git add db/prisma/migrations/
git commit -m "chore: add Prisma migration for Vital table"
```

---

### Final Step: Code review and branch finish

- [ ] Dispatch a final code-reviewer subagent for the entire diff (`git diff master...HEAD`).
- [ ] Use `superpowers:finishing-a-development-branch` to push and open a PR.
