# Rehab backend (Kotlin)

Spring Boot 3.3 + Kotlin + Spring Data JPA + PostgreSQL + JWT (Bearer). REST API для фронтенда в `app/`.

## Стек

- **Kotlin 2.0**, байткод **JDK 17** (Spring Boot 3)
- **Spring Boot**: Web, Data JPA, Security, Validation
- **PostgreSQL** — **источник правды по таблицам для merge с master**: `../db/prisma/schema.prisma` (Prisma). JPA в `src/main/kotlin/com/rehabcenter/domain/` должна совпадать с этой схемой при `spring.jpa.hibernate.ddl-auto=validate`.
- **JJWT** — HS256, claims `userId` и `role`, срок **12h**

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

Интеграционные тесты используют Testcontainers (см. выше). Для полного стека в контейнерах добавьте свой `docker-compose` при необходимости.

## Стиль кода (ktlint)

- Проверка: `./gradlew ktlintCheck` (входит в `./gradlew check`).
- Автоформат: `./gradlew ktlintFormat`
- Настройки: `backend/.editorconfig` (`ktlint_code_style = intellij_idea`).

## Реализованные маршруты

Соответствуют **`docs/api.md`**:  
`/api/auth/login`, `/api/houses`, `/api/users`, `/api/patients`, `/api/rooms`, `/api/meds`, `/api/distributions` (ShiftDist), `/api/med-distributions`, `/api/groups`, `/api/phones`, `/api/shifts`, `/api/schedule`, `/api/consequences`, `/api/finance` (в т.ч. алиасы `/api/finance/patient`, `cashbox`, `cashbox-counts`), `/api/cashbox` (+ `/api/cashbox/counts`), `/api/absences`, `/api/therapy`, `/api/therapy/assignments`, `/api/therapy/sessions`, `/api/summary`, `/api/summaries`, `/api/therapist-assignments`, `GET /health`, Actuator health.

## Деплой (Railway / Heroku)

- В монорепозитории в панели укажите **корень сервиса** каталог `backend/`.
- Сборка: `./gradlew bootJar` (Nixpacks/Gradle buildpack обычно делает это сам).
- Старт: `java -jar build/libs/rehab-backend.jar` — см. `railway.json` и `Procfile` в этом каталоге.

## Нюансы

- `spring.jpa.hibernate.ddl-auto=validate` — Hibernate сверяет сущности с таблицами; **camelCase** имён как в существующей схеме, `globally_quoted_identifiers`.
- Enum в PostgreSQL в JPA отображены **строками** (литералы как в БД).
- Новые сущности получают id **UUID**.
