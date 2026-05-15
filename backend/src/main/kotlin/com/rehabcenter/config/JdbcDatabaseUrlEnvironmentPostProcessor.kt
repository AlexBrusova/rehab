package com.rehabcenter.config

import org.springframework.boot.SpringApplication
import org.springframework.boot.env.EnvironmentPostProcessor
import org.springframework.core.env.ConfigurableEnvironment
import org.springframework.core.env.MapPropertySource

/**
 * Runs before binding: ensures [DATABASE_URL] is JDBC-shaped for Hikari when the platform
 * injects a bare `postgresql://…` URL (e.g. Railway Postgres plugin).
 */
class JdbcDatabaseUrlEnvironmentPostProcessor : EnvironmentPostProcessor {
    override fun postProcessEnvironment(
        environment: ConfigurableEnvironment,
        application: SpringApplication?,
    ) {
        val raw = environment.getProperty("DATABASE_URL")?.trim().orEmpty()
        if (raw.isEmpty()) return
        val normalized = JdbcDatabaseUrlNormalizer.normalize(raw)
        System.err.println("[JdbcNormalizer] raw=$raw normalized=$normalized")
        val props = mutableMapOf<String, Any>("DATABASE_URL" to normalized)
        if (!normalized.lowercase().startsWith("jdbc:")) {
            System.err.println("[JdbcNormalizer] ERROR: normalized URL still missing jdbc: prefix")
        }
        props["spring.datasource.url"] = normalized
        environment.propertySources.addFirst(
            MapPropertySource("rehabDatabaseUrlJdbcPrefix", props),
        )
    }
}
