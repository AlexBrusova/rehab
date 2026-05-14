-- Flyway baseline (пустая БД + FLYWAY_ENABLED=true без DDL от Flyway не поддерживается вместе с JPA validate).
-- Рекомендация: FLYWAY_ENABLED=false, схема из JPA (docker: update) или отдельные SQL-миграции с полным DDL.
SELECT 1;
