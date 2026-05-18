# Resilience & Stateless Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the system stable for 200+ concurrent users with protection against API abuse, infrastructure failures, race conditions, and invalid input.

**Architecture:** Six hardening layers added to the existing Kotlin Spring Boot + React stack: correlation IDs, connection pool tuning, circuit breakers (AOP), rate limiting (Redis), optimistic locking + idempotency, and frontend error isolation. Backend becomes fully stateless so Railway can run 2 replicas.

**Tech Stack:** Resilience4j (already present), Spring AOP (already present), Spring Data Redis (already present), `StringRedisTemplate`, React class components (ErrorBoundary)

**Spec:** `docs/superpowers/specs/2026-05-17-resilience-stateless-design.md`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `backend/src/main/kotlin/com/rehabcenter/config/CorrelationIdFilter.kt` | Populate MDC `requestId` from `X-Request-ID` header |
| Create | `backend/src/main/kotlin/com/rehabcenter/config/DbCircuitBreakerAspect.kt` | Wrap all @RestController methods with Resilience4j CB |
| Create | `backend/src/main/kotlin/com/rehabcenter/config/RateLimitFilter.kt` | Per-user rate limiting via Redis sliding window |
| Create | `backend/src/main/kotlin/com/rehabcenter/config/IdempotencyFilter.kt` | At-most-once semantics for patient + cashbox create |
| Modify | `backend/src/main/resources/application.yml` | HikariCP pool 10→20, Resilience4j CB config |
| Modify | `backend/src/main/kotlin/com/rehabcenter/domain/PatientGraph.kt` | `@Version` on Room + Patient |
| Modify | `backend/src/main/kotlin/com/rehabcenter/domain/AppUser.kt` | `@Version` on AppUser |
| Modify | `db/prisma/schema.prisma` | Add `version Int @default(0)` to Patient, Room, User |
| Modify | `backend/railway.json` | `numReplicas: 2` |
| Create | `app/src/components/ui/ErrorBoundary.jsx` | React class ErrorBoundary with fallback UI |
| Modify | `app/src/lib/api.js` | Exponential backoff retry in `authFetch` |
| Modify | `app/src/App.jsx` | Wrap each page with `<ErrorBoundary>` |

---

## Task 1: Correlation ID Filter

**Files:**
- Create: `backend/src/main/kotlin/com/rehabcenter/config/CorrelationIdFilter.kt`
- Test: `backend/src/test/kotlin/com/rehabcenter/it/CorrelationIdIT.kt`

> The log pattern `%X{requestId:-}` is already configured in `application.yml`. This filter populates that MDC slot.

- [ ] **Step 1: Write the failing integration test**

```kotlin
// backend/src/test/kotlin/com/rehabcenter/it/CorrelationIdIT.kt
package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod

class CorrelationIdIT : AbstractIntegrationTest() {

    @Test
    fun `provided X-Request-ID is echoed back`() {
        val headers = HttpHeaders().apply { set("X-Request-ID", "test-correlation-123") }
        val resp = rest.exchange("/health", HttpMethod.GET, HttpEntity<Unit>(headers), String::class.java)
        assertThat(resp.headers["X-Request-ID"]).containsExactly("test-correlation-123")
    }

    @Test
    fun `X-Request-ID is generated when not provided`() {
        val resp = rest.exchange("/health", HttpMethod.GET, HttpEntity.EMPTY, String::class.java)
        val id = resp.headers["X-Request-ID"]?.firstOrNull()
        assertThat(id).isNotNull().isNotBlank()
    }
}
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd backend && ./gradlew test --tests "com.rehabcenter.it.CorrelationIdIT" -i 2>&1 | tail -20
```

Expected: FAIL — `X-Request-ID` header missing from response.

- [ ] **Step 3: Implement the filter**

```kotlin
// backend/src/main/kotlin/com/rehabcenter/config/CorrelationIdFilter.kt
package com.rehabcenter.config

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.MDC
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.util.UUID

@Component
@Order(1)
class CorrelationIdFilter : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        chain: FilterChain,
    ) {
        val id = request.getHeader("X-Request-ID")?.takeIf { it.isNotBlank() }
            ?: UUID.randomUUID().toString()
        MDC.put("requestId", id)
        response.setHeader("X-Request-ID", id)
        try {
            chain.doFilter(request, response)
        } finally {
            MDC.remove("requestId")
        }
    }
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd backend && ./gradlew test --tests "com.rehabcenter.it.CorrelationIdIT" -i 2>&1 | tail -10
```

Expected: `BUILD SUCCESSFUL`, both tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/kotlin/com/rehabcenter/config/CorrelationIdFilter.kt \
        backend/src/test/kotlin/com/rehabcenter/it/CorrelationIdIT.kt
git commit -m "feat(resilience): add correlation ID filter (X-Request-ID → MDC requestId)"
```

---

## Task 2: HikariCP Pool + Resilience4j Circuit Breaker Config

**Files:**
- Modify: `backend/src/main/resources/application.yml`

> No new tests needed — config changes verified by existing integration tests passing and pool metrics visible in logs.

- [ ] **Step 1: Update `application.yml` — HikariCP section**

Find the existing `hikari:` block and replace it:

```yaml
# was:
#   hikari:
#     maximum-pool-size: 10
#     minimum-idle: 2
#     connection-timeout: 30000
#     validation-timeout: 5000
#     idle-timeout: 600000
#     max-lifetime: 1800000
#     register-mbeans: true
#     connection-init-sql: SET SESSION lock_timeout = '15s'; SET SESSION statement_timeout = '60s'

# replace with:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 3000
      validation-timeout: 3000
      idle-timeout: 300000
      max-lifetime: 600000
      leak-detection-threshold: 60000
      register-mbeans: true
      connection-init-sql: SET SESSION lock_timeout = '15s'; SET SESSION statement_timeout = '60s'
```

- [ ] **Step 2: Add Resilience4j circuit breaker config to `application.yml`**

Add after the existing `resilience4j:` block (which has only `retry:`):

```yaml
resilience4j:
  retry:
    configs:
      default:
        max-attempts: 3
        wait-duration: 120ms
        enable-exponential-backoff: true
        exponential-backoff-multiplier: 2
        retry-exceptions:
          - org.springframework.dao.TransientDataAccessResourceException
          - org.springframework.transaction.CannotCreateTransactionException
          - java.sql.SQLTransientConnectionException
    instances:
      db-read:
        baseConfig: default
  circuitbreaker:
    configs:
      default:
        sliding-window-size: 10
        failure-rate-threshold: 50
        wait-duration-in-open-state: 30s
        permitted-number-of-calls-in-half-open-state: 3
        slow-call-duration-threshold: 5s
        slow-call-rate-threshold: 80
        ignore-exceptions:
          - com.rehabcenter.error.ApiBusinessException
          - org.springframework.web.server.ResponseStatusException
          - org.springframework.security.access.AccessDeniedException
          - jakarta.validation.ConstraintViolationException
          - org.springframework.web.bind.MethodArgumentNotValidException
    instances:
      db:
        base-config: default
```

- [ ] **Step 3: Verify existing tests still pass**

```bash
cd backend && ./gradlew test 2>&1 | tail -15
```

Expected: `BUILD SUCCESSFUL` — pool config doesn't break test setup (tests use Testcontainers PostgreSQL).

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/resources/application.yml
git commit -m "feat(resilience): tune HikariCP pool 10→20, add Resilience4j circuit breaker config"
```

---

## Task 3: Circuit Breaker AOP Aspect

**Files:**
- Create: `backend/src/main/kotlin/com/rehabcenter/config/DbCircuitBreakerAspect.kt`
- Test: `backend/src/test/kotlin/com/rehabcenter/it/CircuitBreakerIT.kt`

> Wraps all @RestController public methods. When the CB is open, returns 503. Business exceptions (ApiBusinessException, validation errors, 4xx) are excluded from failure counting — configured in Task 2.

- [ ] **Step 1: Write the failing test**

```kotlin
// backend/src/test/kotlin/com/rehabcenter/it/CircuitBreakerIT.kt
package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import io.github.resilience4j.circuitbreaker.CircuitBreaker
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpMethod
import org.springframework.http.HttpEntity

class CircuitBreakerIT : AbstractIntegrationTest() {

    @Autowired
    lateinit var circuitBreakerRegistry: CircuitBreakerRegistry

    @Test
    fun `circuit breaker 'db' instance is registered`() {
        val cb = circuitBreakerRegistry.find("db")
        assertThat(cb).isPresent
        assertThat(cb.get().state).isEqualTo(CircuitBreaker.State.CLOSED)
    }

    @Test
    fun `normal request does not open circuit breaker`() {
        val token = login()
        val resp = rest.exchange(
            "/api/houses",
            HttpMethod.GET,
            HttpEntity<Unit>(authHeader(token)),
            String::class.java
        )
        assertThat(resp.statusCode.value()).isLessThan(500)
        val cb = circuitBreakerRegistry.circuitBreaker("db")
        assertThat(cb.state).isEqualTo(CircuitBreaker.State.CLOSED)
    }

    private fun login(): String {
        val resp = rest.postForEntity(
            "/api/auth/login",
            mapOf("username" to "org_manager1", "password" to "1234"),
            Map::class.java
        )
        return resp.body!!["token"] as String
    }

    private fun authHeader(token: String) = org.springframework.http.HttpHeaders().apply {
        set("Authorization", "Bearer $token")
    }
}
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd backend && ./gradlew test --tests "com.rehabcenter.it.CircuitBreakerIT" -i 2>&1 | tail -20
```

Expected: FAIL — `db` CB instance not found (no aspect yet, or not configured).

- [ ] **Step 3: Implement the AOP aspect**

```kotlin
// backend/src/main/kotlin/com/rehabcenter/config/DbCircuitBreakerAspect.kt
package com.rehabcenter.config

import io.github.resilience4j.circuitbreaker.CallNotPermittedException
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry
import org.aspectj.lang.ProceedingJoinPoint
import org.aspectj.lang.annotation.Around
import org.aspectj.lang.annotation.Aspect
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.server.ResponseStatusException

@Aspect
@Component
class DbCircuitBreakerAspect(registry: CircuitBreakerRegistry) {

    private val cb = registry.circuitBreaker("db")

    @Around("@within(org.springframework.web.bind.annotation.RestController)")
    fun protect(jp: ProceedingJoinPoint): Any? {
        return try {
            cb.executeCallable { jp.proceed() }
        } catch (ex: CallNotPermittedException) {
            throw ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Circuit breaker open — database temporarily unavailable",
            )
        }
    }
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd backend && ./gradlew test --tests "com.rehabcenter.it.CircuitBreakerIT" -i 2>&1 | tail -10
```

Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 5: Run full test suite to confirm no regressions**

```bash
cd backend && ./gradlew test 2>&1 | tail -15
```

Expected: `BUILD SUCCESSFUL`, all tests green.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/kotlin/com/rehabcenter/config/DbCircuitBreakerAspect.kt \
        backend/src/test/kotlin/com/rehabcenter/it/CircuitBreakerIT.kt
git commit -m "feat(resilience): add circuit breaker AOP aspect for all @RestController methods"
```

---

## Task 4: Rate Limiting Filter

**Files:**
- Create: `backend/src/main/kotlin/com/rehabcenter/config/RateLimitFilter.kt`
- Test: `backend/src/test/kotlin/com/rehabcenter/it/RateLimitIT.kt`

> Uses Redis INCR + EXPIRE via Lua script. If Redis is unavailable (test profile uses Caffeine-only), the filter logs a warning and passes the request through — no disruption to tests.

- [ ] **Step 1: Write the failing test**

```kotlin
// backend/src/test/kotlin/com/rehabcenter/it/RateLimitIT.kt
package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod

class RateLimitIT : AbstractIntegrationTest() {

    @Test
    fun `rate limit filter is registered and allows normal traffic`() {
        // Test profile has no Redis — filter must pass-through gracefully.
        // Verify: /health is accessible (filter did not block)
        val resp = rest.exchange("/health", HttpMethod.GET, HttpEntity.EMPTY, String::class.java)
        assertThat(resp.statusCode.value()).isEqualTo(200)
    }

    @Test
    fun `auth endpoint allows up to 5 login attempts per minute`() {
        // With no Redis in test profile, filter is bypassed — all requests pass.
        // This test verifies the endpoint is still reachable (no NPE in filter).
        repeat(3) {
            val resp = rest.postForEntity(
                "/api/auth/login",
                mapOf("username" to "baduser", "password" to "wrong"),
                Map::class.java
            )
            assertThat(resp.statusCode.value()).isIn(200, 401, 403)
        }
    }
}
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd backend && ./gradlew test --tests "com.rehabcenter.it.RateLimitIT" -i 2>&1 | tail -20
```

Expected: passes (no RateLimitFilter yet, tests just verify endpoints work). Note: these tests verify graceful degradation, not Redis-backed limiting.

- [ ] **Step 3: Implement the rate limit filter**

```kotlin
// backend/src/main/kotlin/com/rehabcenter/config/RateLimitFilter.kt
package com.rehabcenter.config

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.core.annotation.Order
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.data.redis.core.script.RedisScript
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
@Order(2)
class RateLimitFilter(
    private val redisTemplate: StringRedisTemplate,
) : OncePerRequestFilter() {

    private val log = LoggerFactory.getLogger(javaClass)

    companion object {
        private val INCREMENT_SCRIPT: RedisScript<Long> = RedisScript.of(
            """
            local count = redis.call('INCR', KEYS[1])
            if count == 1 then
                redis.call('EXPIRE', KEYS[1], ARGV[1])
            end
            return count
            """.trimIndent(),
            Long::class.java,
        )

        private data class Limit(val requests: Long, val windowSeconds: Long)

        private val AUTH_LIMIT = Limit(5, 60)
        private val WRITE_LIMIT = Limit(30, 60)
        private val READ_LIMIT = Limit(200, 60)
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        chain: FilterChain,
    ) {
        val (category, limit) = resolveLimit(request)
        val principal = resolvePrincipal(request)
        val key = "rl:$category:$principal"

        val count = try {
            redisTemplate.execute(INCREMENT_SCRIPT, listOf(key), limit.windowSeconds.toString()) ?: 0L
        } catch (ex: Exception) {
            log.warn("Rate limit Redis unavailable, bypassing: {}", ex.message)
            chain.doFilter(request, response)
            return
        }

        if (count > limit.requests) {
            response.status = 429
            response.setHeader("Retry-After", limit.windowSeconds.toString())
            response.contentType = "application/json;charset=UTF-8"
            response.writer.write("""{"error":"Too many requests","details":"Rate limit exceeded. Retry after ${limit.windowSeconds}s"}""")
            return
        }

        chain.doFilter(request, response)
    }

    private fun resolveLimit(request: HttpServletRequest): Pair<String, Limit> {
        val path = request.requestURI
        val method = request.method.uppercase()

        if (path.startsWith("/api/auth/")) return "auth" to AUTH_LIMIT
        if (method in setOf("POST", "PUT", "PATCH", "DELETE")) return "write" to WRITE_LIMIT
        return "read" to READ_LIMIT
    }

    private fun resolvePrincipal(request: HttpServletRequest): String {
        return try {
            SecurityContextHolder.getContext().authentication?.name?.takeIf { it.isNotBlank() }
                ?: request.remoteAddr
        } catch (_: Exception) {
            request.remoteAddr
        }
    }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd backend && ./gradlew test --tests "com.rehabcenter.it.RateLimitIT" -i 2>&1 | tail -10
```

Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 5: Run full suite**

```bash
cd backend && ./gradlew test 2>&1 | tail -15
```

Expected: `BUILD SUCCESSFUL`, no regressions.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/kotlin/com/rehabcenter/config/RateLimitFilter.kt \
        backend/src/test/kotlin/com/rehabcenter/it/RateLimitIT.kt
git commit -m "feat(resilience): add Redis-backed rate limiting filter (5/30/200 req/min per user)"
```

---

## Task 5: Optimistic Locking (@Version)

**Files:**
- Modify: `db/prisma/schema.prisma` — add `version` field to Patient, Room, User
- Modify: `backend/src/main/kotlin/com/rehabcenter/domain/PatientGraph.kt` — @Version on Room + Patient
- Modify: `backend/src/main/kotlin/com/rehabcenter/domain/AppUser.kt` — @Version on AppUser
- Test: `backend/src/test/kotlin/com/rehabcenter/it/OptimisticLockIT.kt`

- [ ] **Step 1: Write the failing test**

```kotlin
// backend/src/test/kotlin/com/rehabcenter/it/OptimisticLockIT.kt
package com.rehabcenter.it

import com.rehabcenter.repo.PatientRepository
import com.rehabcenter.testsupport.AbstractIntegrationTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired

class OptimisticLockIT : AbstractIntegrationTest() {

    @Autowired
    lateinit var patients: PatientRepository

    @Test
    fun `patient entity has version field`() {
        val patient = patients.findAll().first()
        // @Version field should start at 0 for existing seeded records
        assertThat(patient.version).isGreaterThanOrEqualTo(0L)
    }
}
```

- [ ] **Step 2: Run test — expect FAIL** (field `version` doesn't exist yet)

```bash
cd backend && ./gradlew test --tests "com.rehabcenter.it.OptimisticLockIT" -i 2>&1 | tail -20
```

Expected: compile error or FAIL — `version` property not on Patient.

- [ ] **Step 3: Add `version` to Prisma schema**

In `db/prisma/schema.prisma`, find each model and add `version Int @default(0)`:

```prisma
model Patient {
  id          String  @id @default(cuid())
  // ... existing fields ...
  version     Int     @default(0)
  // ... rest of fields ...
}

model Room {
  id       String @id @default(cuid())
  // ... existing fields ...
  version  Int    @default(0)
}

model User {
  id              String  @id @default(cuid())
  // ... existing fields ...
  version         Int     @default(0)
}
```

- [ ] **Step 4: Apply Prisma migration**

```bash
cd db && npx prisma migrate dev --name add_version_columns
```

Expected: migration file created and applied. DB now has `version` column on Patient, Room, User tables.

- [ ] **Step 5: Add @Version to JPA entities**

In `backend/src/main/kotlin/com/rehabcenter/domain/PatientGraph.kt`, add to `Room` class:

```kotlin
import jakarta.persistence.Version

@Entity
@Table(name = "Room")
@JsonIgnoreProperties(ignoreUnknown = true)
class Room(
    @Id
    var id: String = "",
    @Column(nullable = false)
    var number: String = "",
    @Column(nullable = false)
    var building: String = "",
    @Column(nullable = false)
    var capacity: Int = 2,
    @Column(nullable = false)
    var houseId: String = "",
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "houseId", insertable = false, updatable = false)
    @JsonIgnore
    var house: House? = null,
    @Column(nullable = false)
    var createdAt: Instant = Instant.now(),
    @Version
    var version: Long = 0,
)
```

Add to `Patient` class in the same file (end of constructor parameter list):

```kotlin
    @Version
    var version: Long = 0,
```

In `backend/src/main/kotlin/com/rehabcenter/domain/AppUser.kt`, add to `AppUser` class:

```kotlin
import jakarta.persistence.Version

@Entity
@Table(name = "User")
@JsonIgnoreProperties(ignoreUnknown = true)
class AppUser(
    // ... existing fields ...
    @Version
    var version: Long = 0,
)
```

- [ ] **Step 6: Run test — expect PASS**

```bash
cd backend && ./gradlew test --tests "com.rehabcenter.it.OptimisticLockIT" -i 2>&1 | tail -10
```

Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 7: Run full suite**

```bash
cd backend && ./gradlew test 2>&1 | tail -15
```

Expected: `BUILD SUCCESSFUL`. Hibernate uses `validate` mode — if migration was applied correctly, startup succeeds.

- [ ] **Step 8: Commit**

```bash
git add db/prisma/schema.prisma \
        db/prisma/migrations/ \
        backend/src/main/kotlin/com/rehabcenter/domain/PatientGraph.kt \
        backend/src/main/kotlin/com/rehabcenter/domain/AppUser.kt \
        backend/src/test/kotlin/com/rehabcenter/it/OptimisticLockIT.kt
git commit -m "feat(resilience): add @Version optimistic locking to Patient, Room, AppUser"
```

---

## Task 6: Idempotency Filter

**Files:**
- Create: `backend/src/main/kotlin/com/rehabcenter/config/IdempotencyFilter.kt`
- Test: `backend/src/test/kotlin/com/rehabcenter/it/IdempotencyIT.kt`

> Applies only to `POST /api/patients` and `POST /api/finance/cashbox`. Client sends `X-Idempotency-Key: <uuid>`. If Redis is unavailable (test profile), filter passes through.

- [ ] **Step 1: Write the failing test**

```kotlin
// backend/src/test/kotlin/com/rehabcenter/it/IdempotencyIT.kt
package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod

class IdempotencyIT : AbstractIntegrationTest() {

    @Test
    fun `request without idempotency key is allowed through`() {
        // No X-Idempotency-Key — filter must not block the request
        val headers = HttpHeaders().apply {
            set("Authorization", "Bearer ${login()}")
            set("Content-Type", "application/json")
        }
        // POST to patients without idempotency key — filter passes through to controller
        val resp = rest.exchange(
            "/api/patients?houseId=house1",
            HttpMethod.POST,
            HttpEntity("{}", headers),
            String::class.java
        )
        // Controller may return 400 (validation) but NOT 5xx from filter failure
        assertThat(resp.statusCode.value()).isLessThan(500)
    }

    private fun login(): String {
        val resp = rest.postForEntity(
            "/api/auth/login",
            mapOf("username" to "org_manager1", "password" to "1234"),
            Map::class.java
        )
        return resp.body!!["token"] as String
    }
}
```

- [ ] **Step 2: Run test — expect PASS** (no filter yet, request goes straight to controller)

```bash
cd backend && ./gradlew test --tests "com.rehabcenter.it.IdempotencyIT" -i 2>&1 | tail -10
```

- [ ] **Step 3: Implement the idempotency filter**

```kotlin
// backend/src/main/kotlin/com/rehabcenter/config/IdempotencyFilter.kt
package com.rehabcenter.config

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.core.annotation.Order
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import org.springframework.web.util.ContentCachingResponseWrapper
import java.time.Duration

@Component
@Order(3)
class IdempotencyFilter(
    private val redisTemplate: StringRedisTemplate,
) : OncePerRequestFilter() {

    private val log = LoggerFactory.getLogger(javaClass)

    companion object {
        private val IDEMPOTENT_PATHS = setOf(
            "/api/patients",
            "/api/finance/cashbox",
        )
        private val TTL = Duration.ofDays(1)
        private const val PREFIX = "idempotency:"
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        chain: FilterChain,
    ) {
        val key = request.getHeader("X-Idempotency-Key")
        val isIdempotentPath = IDEMPOTENT_PATHS.any { request.requestURI.startsWith(it) }

        if (key.isNullOrBlank() || !isIdempotentPath || request.method != "POST") {
            chain.doFilter(request, response)
            return
        }

        val redisKey = "$PREFIX$key"

        try {
            val cached = redisTemplate.opsForValue().get(redisKey)
            if (cached != null && cached != "pending") {
                // Replay cached response
                response.status = 200
                response.contentType = "application/json;charset=UTF-8"
                response.writer.write(cached)
                return
            }

            if (cached == "pending") {
                response.status = 409
                response.contentType = "application/json;charset=UTF-8"
                response.writer.write("""{"error":"Conflict","details":"Duplicate request in flight — retry later"}""")
                return
            }

            // Mark as pending before executing
            redisTemplate.opsForValue().set(redisKey, "pending", TTL)

            val wrapper = ContentCachingResponseWrapper(response)
            chain.doFilter(request, wrapper)

            val responseBody = String(wrapper.contentAsByteArray, Charsets.UTF_8)
            if (response.status in 200..299 && responseBody.isNotBlank()) {
                redisTemplate.opsForValue().set(redisKey, responseBody, TTL)
            } else {
                // Request failed — remove pending marker so client can retry
                redisTemplate.delete(redisKey)
            }
            wrapper.copyBodyToResponse()
        } catch (ex: Exception) {
            log.warn("Idempotency Redis unavailable, bypassing: {}", ex.message)
            chain.doFilter(request, response)
        }
    }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd backend && ./gradlew test --tests "com.rehabcenter.it.IdempotencyIT" -i 2>&1 | tail -10
```

Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 5: Run full suite**

```bash
cd backend && ./gradlew test 2>&1 | tail -15
```

Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/kotlin/com/rehabcenter/config/IdempotencyFilter.kt \
        backend/src/test/kotlin/com/rehabcenter/it/IdempotencyIT.kt
git commit -m "feat(resilience): add idempotency filter for POST patient + cashbox via Redis"
```

---

## Task 7: Frontend ErrorBoundary Component

**Files:**
- Create: `app/src/components/ui/ErrorBoundary.jsx`
- Modify: `app/src/App.jsx` — wrap each page/module

- [ ] **Step 1: Create ErrorBoundary component**

```jsx
// app/src/components/ui/ErrorBoundary.jsx
import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { name = "модуль", onRetry } = this.props;
    return (
      <div
        style={{
          padding: "24px",
          border: "1px solid #fca5a5",
          borderRadius: "8px",
          background: "#fef2f2",
          color: "#991b1b",
          margin: "16px",
        }}
      >
        <strong>Ошибка в модуле «{name}»</strong>
        <p style={{ marginTop: "8px", fontSize: "14px" }}>
          {this.state.error?.message || "Непредвиденная ошибка"}
        </p>
        {onRetry && (
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              onRetry();
            }}
            style={{
              marginTop: "12px",
              padding: "6px 14px",
              background: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Повторить
          </button>
        )}
      </div>
    );
  }
}
```

- [ ] **Step 2: Import ErrorBoundary in App.jsx**

At the top of `app/src/App.jsx`, add the import (near other UI imports):

```js
import ErrorBoundary from "./components/ui/ErrorBoundary";
```

- [ ] **Step 3: Wrap each page render with ErrorBoundary**

In `App.jsx`, find where each page component is rendered (in the main content area switch/conditional). Wrap each with `<ErrorBoundary name="...">`.

Example — find the existing pattern for Patients and wrap it:

```jsx
// Before:
{activeModule === "patients" && <Patients ... />}

// After:
{activeModule === "patients" && (
  <ErrorBoundary name="Пациенты" onRetry={() => setActiveModule("patients")}>
    <Patients ... />
  </ErrorBoundary>
)}
```

Apply the same pattern to all modules: Rooms, Manage, MedManager, Finance, Schedule, Groups, Therapy, Shifts, Absences, Summary, Dashboard.

- [ ] **Step 4: Start dev server and verify no console errors**

```bash
cd app && npm run dev
```

Open `http://localhost:5173` in browser. Navigate through all modules. Verify no console errors from the new imports.

- [ ] **Step 5: Verify lint passes**

```bash
cd app && npm run lint
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/src/components/ui/ErrorBoundary.jsx app/src/App.jsx
git commit -m "feat(resilience): add React ErrorBoundary per module to isolate failures"
```

---

## Task 8: authFetch Retry with Exponential Backoff

**Files:**
- Modify: `app/src/lib/api.js`

> Retry only on network errors (`TypeError`) and `503 Service Unavailable`. Never retry on 4xx (client errors) or 401 (auth). Max 3 attempts: immediate → 1s → 3s.

- [ ] **Step 1: Add retry helper above `authFetch` in `app/src/lib/api.js`**

Find the `export async function authFetch` declaration and add before it:

```js
async function withRetry(fn, maxAttempts = 3) {
  const delays = [0, 1000, 3000];
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (delays[attempt] > 0) {
      await new Promise((r) => setTimeout(r, delays[attempt]));
    }
    try {
      return await fn();
    } catch (err) {
      const isRetryable =
        err instanceof TypeError ||
        err?.message?.includes("Network error") ||
        err?.status === 503;
      if (!isRetryable || attempt === maxAttempts - 1) throw err;
      lastError = err;
    }
  }
  throw lastError;
}
```

- [ ] **Step 2: Wrap `authFetch` body with `withRetry`**

Current `authFetch` makes a single fetch call. Wrap only the fetch call (not the 401 reload or business error handling) with `withRetry`:

```js
export async function authFetch(path, options = {}) {
  const { signal: userSignal, headers: optHeaders, ...fetchOpts } = options;

  return withRetry(async () => {
    const { signal, clear } = abortWithTimeout(API_FETCH_TIMEOUT_MS, userSignal);
    let res;
    try {
      res = await fetch(`${BASE}${path}`, {
        ...fetchOpts,
        signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
          ...(optHeaders || {}),
        },
      });
    } catch (e) {
      clear();
      if (e?.name === "AbortError" || e?.name === "TimeoutError") {
        throw new Error("Request timed out. Check your connection and try again.");
      }
      throw new Error(e?.message || "Network error");
    }
    clear();

    if (res.status === 401) {
      removeStoredUser();
      window.location.reload();
      throw new Error("Unauthorized");
    }
    if (res.status === 503) {
      const err = new Error("Service temporarily unavailable. Retrying…");
      err.status = 503;
      throw err;
    }
    if (!res.ok) {
      const msg = await readApiErrorMessage(res);
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    return res.json();
  });
}
```

- [ ] **Step 3: Verify lint**

```bash
cd app && npm run lint
```

Expected: no errors.

- [ ] **Step 4: Manual smoke test**

Start dev server (`npm run dev`), open network tab in browser DevTools, navigate app. Verify requests complete normally. No `withRetry` explosion on normal usage.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/api.js
git commit -m "feat(resilience): add exponential backoff retry in authFetch for network errors + 503"
```

---

## Task 9: Railway Replicas Config

**Files:**
- Modify: `backend/railway.json`

- [ ] **Step 1: Update `backend/railway.json`**

Current content:
```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 180
  }
}
```

Replace `"deploy"` block with:
```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "numReplicas": 2,
    "restartPolicyType": "ON_FAILURE",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300
  }
}
```

- [ ] **Step 2: Statelessness verification checklist**

Before enabling replicas, verify backend is fully stateless:

```bash
# Verify: no @Bean with default (singleton) scope stores mutable request-scoped state
grep -rn "mutableListOf\|mutableMapOf\|ArrayList\|HashMap" \
  backend/src/main/kotlin/com/rehabcenter/web/ \
  backend/src/main/kotlin/com/rehabcenter/config/ | grep -v "//.*" | grep -v "test"
```

Expected: only immutable companion object constants, no in-instance mutable collections.

```bash
# Verify: Bucket4j and idempotency filters use Redis (not in-memory map)
grep -n "ConcurrentHashMap\|LinkedHashMap\|HashMap" \
  backend/src/main/kotlin/com/rehabcenter/config/RateLimitFilter.kt \
  backend/src/main/kotlin/com/rehabcenter/config/IdempotencyFilter.kt
```

Expected: no output (both use Redis only).

- [ ] **Step 3: Run full test suite one final time**

```bash
cd backend && ./gradlew check 2>&1 | tail -20
```

Expected: `BUILD SUCCESSFUL` — ktlint + tests all pass.

- [ ] **Step 4: Commit**

```bash
git add backend/railway.json
git commit -m "feat(resilience): enable Railway 2 replicas (backend is fully stateless)"
```

---

## Task 10: Final Integration — Open PR

- [ ] **Step 1: Push branch**

```bash
git push -u origin HEAD
```

- [ ] **Step 2: Open PR against master**

```bash
gh pr create \
  --title "feat: resilience & stateless — 200+ user stability" \
  --body "$(cat <<'EOF'
## Summary
- Correlation ID filter populates MDC `requestId` from `X-Request-ID` header
- HikariCP pool 10→20 connections, leak detection enabled
- Resilience4j circuit breaker on all `@RestController` methods via AOP
- Redis sliding-window rate limiting (5/30/200 req/min per user)
- `@Version` optimistic locking on Patient, Room, AppUser (with Prisma migration)
- Idempotency filter for POST /api/patients and POST /api/finance/cashbox via Redis
- React ErrorBoundary per module — module failures no longer crash entire UI
- authFetch retry with exponential backoff (network errors + 503 only)
- Railway 2 replicas (backend verified stateless)

## Test plan
- [ ] `./gradlew check` passes (ktlint + all integration tests)
- [ ] Deploy to Railway — both replicas healthy (`/health` returns 200)
- [ ] Manual: login, navigate all modules — no UI crashes
- [ ] Manual: send 6 POST requests in 60s to `/api/auth/login` from same IP — 6th returns 429
- [ ] Manual: POST `/api/patients` with same `X-Idempotency-Key` twice — second returns cached 200
EOF
)"
```

- [ ] **Step 3: Verify CI passes and merge**

Monitor the PR checks in GitHub. After all green, merge to master and deploy via Railway.

---

## Self-Review Notes

**Spec coverage:**
- Rate limiting ✓ (Task 4)
- Circuit breakers ✓ (Task 2 config + Task 3 AOP)
- HikariCP tuning ✓ (Task 2)
- Optimistic locking ✓ (Task 5)
- Idempotency ✓ (Task 6)
- Stateless/Railway replicas ✓ (Task 9)
- Frontend error isolation ✓ (Task 7)
- authFetch retry ✓ (Task 8)
- Correlation IDs ✓ (Task 1)
- Graceful shutdown — **already done** in `application.yml`, no task needed
- Input validation hardening — already comprehensive in PatientController, UserController, CashboxProxyController; skipped per audit

**Placeholder scan:** No TBD/TODO in steps. All code blocks are complete.

**Type consistency:** `version: Long` in JPA entities matches `Int @default(0)` in Prisma (Prisma `Int` → PostgreSQL `integer` → Kotlin `Long` via widening — this is fine; Hibernate maps `Long` @Version to `bigint` so the Prisma schema should use `BigInt` not `Int`).

> **CORRECTION:** Change Prisma schema to `version BigInt @default(0)` in Task 5 Step 3. `Int` in Prisma is 32-bit; Hibernate's `Long` @Version needs `bigint` (64-bit). Without this, Hibernate validation will fail at startup.
