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
