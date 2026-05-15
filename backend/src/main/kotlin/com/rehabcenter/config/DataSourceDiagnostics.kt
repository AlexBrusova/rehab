package com.rehabcenter.config

import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties
import org.springframework.context.annotation.Configuration
import org.springframework.core.env.Environment
import jakarta.annotation.PostConstruct

/**
 * Logs the resolved datasource URL at startup so we can see exactly what
 * Hikari is about to use — before Hibernate tries to connect.
 */
@Configuration
class DataSourceDiagnostics(
    private val dataSourceProperties: DataSourceProperties,
    private val environment: Environment,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @PostConstruct
    fun logDatasourceConfig() {
        val url = dataSourceProperties.url ?: "NULL"
        val username = dataSourceProperties.username ?: "NULL"
        val envDbUrl = environment.getProperty("DATABASE_URL") ?: "NOT_SET"
        val envSpringUrl = environment.getProperty("spring.datasource.url") ?: "NOT_SET"
        val envSpringUrlRaw = environment.getProperty("SPRING_DATASOURCE_URL") ?: "NOT_SET"

        log.info("=== DataSource Diagnostics ===")
        log.info("  DataSourceProperties.url      = {}", url)
        log.info("  DataSourceProperties.username = {}", username)
        log.info("  env DATABASE_URL              = {}", maskPass(envDbUrl))
        log.info("  env spring.datasource.url     = {}", maskPass(envSpringUrl))
        log.info("  env SPRING_DATASOURCE_URL     = {}", maskPass(envSpringUrlRaw))
        log.info("  URL starts with jdbc:         = {}", url.lowercase().startsWith("jdbc:"))
        log.info("  URL has // after postgresql:  = {}", url.lowercase().contains("postgresql://"))
        log.info("==============================")
    }

    private fun maskPass(url: String) =
        url.replace(Regex("(://[^:]+:)[^@]+(@)"), "$1***$2")
}
