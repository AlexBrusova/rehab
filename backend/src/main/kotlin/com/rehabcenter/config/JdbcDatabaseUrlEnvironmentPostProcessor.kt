package com.rehabcenter.config

import org.springframework.boot.SpringApplication
import org.springframework.boot.env.EnvironmentPostProcessor
import org.springframework.core.env.ConfigurableEnvironment
import org.springframework.core.env.MapPropertySource

/**
 * Runs before Spring binding. Normalizes DATABASE_URL and SPRING_DATASOURCE_URL
 * to jdbc:postgresql://… form required by Hikari.
 *
 * Uses System.err (not a Logger) because logging is not yet configured at this point.
 */
class JdbcDatabaseUrlEnvironmentPostProcessor : EnvironmentPostProcessor {

    override fun postProcessEnvironment(
        environment: ConfigurableEnvironment,
        application: SpringApplication?,
    ) {
        log("=== JdbcDatabaseUrlEnvironmentPostProcessor START ===")

        // Dump all DB-related env keys for visibility
        listOf(
            "DATABASE_URL",
            "SPRING_DATASOURCE_URL",
            "DB_USER",
            "DB_PASSWORD",
            "PGHOST",
            "PGPORT",
            "PGDATABASE",
        ).forEach { key ->
            val v = environment.getProperty(key)
            if (v != null) {
                // Mask password portion but show host/db structure
                val masked = maskCredentials(v)
                log("  ENV $key=$masked")
            } else {
                log("  ENV $key=<not set>")
            }
        }

        val props = mutableMapOf<String, Any>()

        // Normalize DATABASE_URL
        val rawDb = environment.getProperty("DATABASE_URL")?.trim().orEmpty()
        if (rawDb.isNotEmpty()) {
            val normalized = JdbcDatabaseUrlNormalizer.normalize(rawDb)
            log("  DATABASE_URL raw    : ${maskCredentials(rawDb)}")
            log("  DATABASE_URL normal : ${maskCredentials(normalized)}")
            props["DATABASE_URL"] = normalized
        }

        // Normalize SPRING_DATASOURCE_URL if explicitly set
        val rawSpring = environment.getProperty("SPRING_DATASOURCE_URL")?.trim().orEmpty()
        if (rawSpring.isNotEmpty()) {
            val normalized = JdbcDatabaseUrlNormalizer.normalize(rawSpring)
            log("  SPRING_DATASOURCE_URL raw    : ${maskCredentials(rawSpring)}")
            log("  SPRING_DATASOURCE_URL normal : ${maskCredentials(normalized)}")
            props["SPRING_DATASOURCE_URL"] = normalized
        }

        // Determine the final JDBC URL for spring.datasource.url
        val finalUrl: String? = when {
            // Prefer explicit SPRING_DATASOURCE_URL
            rawSpring.isNotEmpty() -> props["SPRING_DATASOURCE_URL"] as String
            // Fall back to DATABASE_URL
            rawDb.isNotEmpty() -> props["DATABASE_URL"] as String
            else -> null
        }

        if (finalUrl == null) {
            log("  No DB URL found in environment — skipping")
            log("=== JdbcDatabaseUrlEnvironmentPostProcessor END (no-op) ===")
            return
        }

        if (!finalUrl.lowercase().startsWith("jdbc:")) {
            log("  CRITICAL: final URL does not start with jdbc: — Hikari will reject it!")
            log("            value: ${maskCredentials(finalUrl)}")
        } else {
            log("  spring.datasource.url will be: ${maskCredentials(finalUrl)}")
        }

        props["spring.datasource.url"] = finalUrl

        environment.propertySources.addFirst(
            MapPropertySource("rehabDatabaseUrlJdbcPrefix", props),
        )

        log("=== JdbcDatabaseUrlEnvironmentPostProcessor END (applied) ===")
    }

    private fun log(msg: String) = System.err.println("[JdbcNormalizer] $msg")

    /** Masks password in jdbc/postgresql URLs for safe logging. */
    private fun maskCredentials(url: String): String {
        return url.replace(Regex("(://[^:]+:)[^@]+(@)"), "$1***$2")
    }
}
