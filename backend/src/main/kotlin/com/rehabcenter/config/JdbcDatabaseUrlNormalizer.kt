package com.rehabcenter.config

/**
 * Railway / Heroku Postgres often expose [DATABASE_URL] as `postgresql://…` or `postgres://…`.
 * Spring Boot + Hikari expect `jdbc:postgresql://…`.
 */
object JdbcDatabaseUrlNormalizer {
    fun normalize(raw: String): String {
        val t = raw.trim()
        if (t.isEmpty()) return t
        val lower = t.lowercase()
        if (lower.startsWith("jdbc:postgresql://") || lower.startsWith("jdbc:pgsql://")) {
            return t
        }
        if (lower.startsWith("postgresql://")) {
            return "jdbc:$t"
        }
        if (lower.startsWith("postgres://")) {
            return "jdbc:postgresql://${t.substring("postgres://".length)}"
        }
        return t
    }
}
