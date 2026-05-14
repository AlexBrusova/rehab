package com.rehabcenter.config

/**
 * Railway / Heroku Postgres often expose [DATABASE_URL] as `postgresql://…` or `postgres://…`.
 * Spring Boot + Hikari expect `jdbc:postgresql://…` (authority must follow `//`, not `:`).
 *
 * Also fixes mistaken URLs like `jdbc:postgresql:user:pass@host/db` (missing `//`), where the
 * JDBC driver treats `user:pass@host` as a single hostname.
 *
 * Public Railway TCP proxy hostnames (`*.rlwy.net`, e.g. `viaduct.proxy.rlwy.net`) typically
 * require TLS; we append `sslmode=require` when missing so the driver negotiates SSL.
 */
object JdbcDatabaseUrlNormalizer {
    fun normalize(raw: String): String {
        var t = raw.trim()
        if (t.isEmpty()) return t
        var lower = t.lowercase()

        if (lower.startsWith("jdbc:postgresql:postgresql://")) {
            t = "jdbc:postgresql://" + t.substring("jdbc:postgresql:postgresql://".length)
            lower = t.lowercase()
        }
        if (lower.startsWith("jdbc:postgresql:postgres://")) {
            t = "jdbc:postgresql://" + t.substring("jdbc:postgresql:postgres://".length)
            lower = t.lowercase()
        }
        if (lower.startsWith("jdbc:postgresql:") && !lower.startsWith("jdbc:postgresql://")) {
            val rest = t.replaceFirst(Regex("(?i)^jdbc:postgresql:"), "")
            t = "jdbc:postgresql://$rest"
            lower = t.lowercase()
        }

        if (lower.startsWith("jdbc:postgresql://") || lower.startsWith("jdbc:pgsql://")) {
            return withRailwayPublicProxySsl(t)
        }
        if (lower.startsWith("postgresql://")) {
            return withRailwayPublicProxySsl("jdbc:$t")
        }
        if (lower.startsWith("postgres://")) {
            return withRailwayPublicProxySsl("jdbc:postgresql://${t.substring("postgres://".length)}")
        }
        return t
    }

    /** Public Railway Postgres proxy (`*.rlwy.net`) expects SSL from the client. */
    private fun withRailwayPublicProxySsl(jdbcUrl: String): String {
        val l = jdbcUrl.lowercase()
        if (!l.startsWith("jdbc:postgresql://") && !l.startsWith("jdbc:pgsql://")) {
            return jdbcUrl
        }
        if (!l.contains(".rlwy.net")) {
            return jdbcUrl
        }
        if (l.contains("sslmode=")) {
            return jdbcUrl
        }
        val sep = if (jdbcUrl.contains("?")) "&" else "?"
        return "$jdbcUrl${sep}sslmode=require"
    }
}
