package com.rehabcenter.config

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class JdbcDatabaseUrlNormalizerTest {
    @Test
    fun `postgresql scheme gets jdbc prefix`() {
        assertThat(JdbcDatabaseUrlNormalizer.normalize("postgresql://u:p@host:5432/railway"))
            .isEqualTo("jdbc:postgresql://u:p@host:5432/railway")
    }

    @Test
    fun `postgres alias becomes jdbc postgresql`() {
        assertThat(JdbcDatabaseUrlNormalizer.normalize("postgres://u:p@host:5432/db"))
            .isEqualTo("jdbc:postgresql://u:p@host:5432/db")
    }

    @Test
    fun `already jdbc url unchanged`() {
        val u = "jdbc:postgresql://localhost:5432/rehab"
        assertThat(JdbcDatabaseUrlNormalizer.normalize(u)).isEqualTo(u)
    }

    @Test
    fun `empty unchanged`() {
        assertThat(JdbcDatabaseUrlNormalizer.normalize("   ")).isEqualTo("")
    }

    @Test
    fun `jdbc postgresql missing slashes inserts authority slash`() {
        assertThat(JdbcDatabaseUrlNormalizer.normalize("jdbc:postgresql:user:secret@db.example:5432/railway"))
            .isEqualTo("jdbc:postgresql://user:secret@db.example:5432/railway")
    }

    @Test
    fun `double postgresql scheme collapsed`() {
        assertThat(JdbcDatabaseUrlNormalizer.normalize("jdbc:postgresql:postgresql://u@h/db"))
            .isEqualTo("jdbc:postgresql://u@h/db")
    }

    @Test
    fun `railway public rlwy net url gets sslmode require`() {
        assertThat(
            JdbcDatabaseUrlNormalizer.normalize(
                "postgresql://u:p@viaduct.proxy.rlwy.net:23249/railway",
            ),
        ).isEqualTo("jdbc:postgresql://u:p@viaduct.proxy.rlwy.net:23249/railway?sslmode=require")
    }

    @Test
    fun `sslmode already set not duplicated`() {
        assertThat(
            JdbcDatabaseUrlNormalizer.normalize(
                "postgresql://u:p@viaduct.proxy.rlwy.net:23249/railway?sslmode=disable",
            ),
        ).isEqualTo("jdbc:postgresql://u:p@viaduct.proxy.rlwy.net:23249/railway?sslmode=disable")
    }
}
