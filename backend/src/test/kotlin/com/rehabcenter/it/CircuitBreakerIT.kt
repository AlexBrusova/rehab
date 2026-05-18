package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import io.github.resilience4j.circuitbreaker.CircuitBreaker
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod

class CircuitBreakerIT : AbstractIntegrationTest() {

    @Autowired
    lateinit var circuitBreakerRegistry: CircuitBreakerRegistry

    @Test
    fun `circuit breaker 'db' instance is registered`() {
        val cb = circuitBreakerRegistry.find("db")
        assertThat(cb).isPresent
        assertThat(cb.get().state).isEqualTo(CircuitBreaker.State.CLOSED)
    }

    @Test
    fun `normal request does not open circuit breaker`() {
        val token = login()
        val resp = rest.exchange(
            "/api/houses",
            HttpMethod.GET,
            HttpEntity<Unit>(authHeader(token)),
            String::class.java,
        )
        assertThat(resp.statusCode.value()).isLessThan(500)
        val cb = circuitBreakerRegistry.circuitBreaker("db")
        assertThat(cb.state).isEqualTo(CircuitBreaker.State.CLOSED)
    }

    private fun login(): String {
        val resp = rest.postForEntity(
            "/api/auth/login",
            mapOf("username" to "org_manager1", "password" to "1234"),
            Map::class.java,
        )
        return resp.body!!["token"] as String
    }

    private fun authHeader(token: String) = org.springframework.http.HttpHeaders().apply {
        set("Authorization", "Bearer $token")
    }
}
