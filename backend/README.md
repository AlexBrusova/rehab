# Rehab backend (Kotlin)

Spring Boot 3.3 + Kotlin + Spring Data JPA + PostgreSQL + JWT (Bearer). REST API для фронтенда в `app/`. **Карта всего монорепозитория:** [`../docs/PROJECT_STRUCTURE.md`](../docs/PROJECT_STRUCTURE.md).

## Стек

- **Kotlin 2.0**, байткод **JDK 17** (Spring Boot 3)
- **Spring Boot**: Web, Data JPA, Security, Validation, **Cache** (Caffeine локально / Redis в профиле `docker`, TTL кеша `houses` **1 сутки**)
- **PostgreSQL** — **источник правды по таблицам для merge с master**: `../db/prisma/schema.prisma` (Prisma). JPA в `src/main/kotlin/com/rehabcenter/domain/` должна совпадать с этой схемой при `spring.jpa.hibernate.ddl-auto=validate`.
- **JJWT** — HS256, claims `userId` и `role`, срок **12h**

## Устойчивость (resilience)

- **Graceful shutdown** и таймаут фазы остановки — `server.shutdown`, `spring.lifecycle.timeout-per-shutdown-phase` в `application.yml`.
- **Tomcat**: лимит потоков, `accept-count`, таймаут соединения.
- **Hikari**: `minimum-idle`, `idle-timeout`, `max-lifetime`, MBean-регистрация для мониторинга.
- **JPA**: глобальный таймаут запросов `jakarta.persistence.query.timeout`.
- **Resilience4j Retry** (`db-read`) на чтение списка домов — повтор при кратковременных сбоях БД/пула (`HouseQueryService`).
- **Кеш**: `ResilientCacheErrorHandler` — при падении Redis (или другого провайдера) GET не рвёт запрос (идём в БД), ошибки записи в кеш логируются.
- **Профиль `docker`**: двухуровневый кеш **Redis + Caffeine** (`DockerTieredCacheConfiguration`, `TieredCache`) — при ошибках Redis чтение/запись обслуживается из локального in-process Caffeine (тот же TTL и имена кешей, префикс ключей Redis как в `spring.cache.redis`).
- **Health**: группа `readiness` (`readinessState`, `db`; в профиле `docker` ещё `redis`), включены `liveness-state` / `readiness-state` для Kubernetes.
- **Ошибки**: `503` для Redis down, `TransientDataAccessResourceException` и существующие таймауты/транзакции — см. `RestApiExceptionHandler`.
- **Docker / Redis**: `spring.data.redis.timeout` и `connect-timeout` в `application-docker.yml`.

## Запуск

1. **База:** PostgreSQL; схему поднимает **Prisma** из каталога `db/` (`cd ../db && npx prisma migrate dev` или `npx prisma db push`). После merge с master примените миграции до запуска Kotlin.
2. **Переменные** — см. `backend/.env.example`. Для JDBC удобен URL вида `jdbc:postgresql://host:5432/dbname` (или `spring.datasource.*` в `application.yml`).
3. Сборка и старт:

```bash
cd backend
./gradlew bootRun
```

Проверка: `GET http://localhost:4000/health` → `{"ok":true}`. Kubernetes-style пробы: `GET /actuator/health`, `/actuator/health/liveness`, `/actuator/health/readiness`.

## Интеграционные тесты

Профиль **`test`**: in-memory схема через Hibernate (`ddl-auto: create-drop`), Flyway выключен; перед каждым тестом БД очищается и заполняется тем же набором данных, что и демо-сид (`RehabSeedContent`), пароли **`1234`**.

Запуск только тестов: `./gradlew test`. Требуется **Docker** (Testcontainers поднимает `postgres:16-alpine`). Если Docker недоступен, интеграционные тесты помечаются как **пропущенные** (JUnit `@EnabledIf`), а `./gradlew check` всё равно проходит — на CI с Docker тесты выполняются полностью.

## Docker и CI

Полный стек (Postgres, **Redis**, API, фронт, **Prometheus**, **Grafana**, **Loki**, **Promtail**) — в корне репозитория: **`../docker-compose.yml`**. Метрики: `GET /actuator/prometheus` (в профиле `docker` без авторизации). Логи контейнеров собирает Promtail в Loki; дашборд *Rehab API overview* в Grafana.

Интеграционные тесты используют Testcontainers (см. выше), Redis в тестах отключён автоконфигурацией, кеш — **Caffeine**.

## Стиль кода (ktlint)

- Проверка: `./gradlew ktlintCheck` (входит в `./gradlew check`).
- Автоформат: `./gradlew ktlintFormat`
- Настройки: `backend/.editorconfig` (`ktlint_code_style = intellij_idea`).

## Реализованные маршруты

Соответствуют **`docs/api.md`**:  
`/api/auth/login`, `/api/houses`, `/api/users`, `/api/patients`, `/api/rooms`, `/api/meds`, `/api/distributions` (ShiftDist), `/api/med-distributions`, `/api/groups`, `/api/phones`, `/api/shifts`, `/api/schedule`, `/api/consequences`, `/api/finance` (в т.ч. алиасы `/api/finance/patient`, `cashbox`, `cashbox-counts`), `/api/cashbox` (+ `/api/cashbox/counts`), `/api/absences`, `/api/therapy`, `/api/therapy/assignments`, `/api/therapy/sessions`, `/api/summary`, `/api/summaries`, `/api/therapist-assignments`, `GET /health`, Actuator health.

## Деплой (Railway / Heroku)

- В монорепозитории в Railway: **Settings → Root Directory** = `backend` (каталог **`server/` больше не существует**; если там остался старый путь, сборка падает с `snapshot-target-unpack/server does not exist`).
- **Config as code:** при Root Directory `backend` достаточно файла `railway.json` в этом каталоге. Если корень репозитория не меняли, в настройках сервиса укажите путь к конфигу: **`/backend/railway.json`** (конфиг не следует за Root Directory — см. [документацию Railway по monorepo](https://docs.railway.com/guides/monorepo)).
- Сборка: **Dockerfile** в `backend/` (`railway.json`: `builder` = `DOCKERFILE`). Образ стартует через `ENTRYPOINT` из Dockerfile (`java -jar /app/app.jar`).
- Heroku: по-прежнему см. `Procfile` в этом каталоге (`web: java -jar build/libs/rehab-backend.jar` после slug-сборки Gradle).

## Нюансы

- `spring.jpa.hibernate.ddl-auto=validate` — Hibernate сверяет сущности с таблицами; **camelCase** имён как в существующей схеме, `globally_quoted_identifiers`.
- Enum в PostgreSQL в JPA отображены **строками** (литералы как в БД).
- Новые сущности получают id **UUID**.
