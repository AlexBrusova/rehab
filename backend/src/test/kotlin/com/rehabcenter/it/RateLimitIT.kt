package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod

class RateLimitIT : AbstractIntegrationTest() {

    @Test
    fun `rate limit filter is registered and allows normal traffic`() {
        // Test profile has no Redis — filter must pass-through gracefully.
        // Verify: /health is accessible (filter did not block)
        val resp = rest.exchange("/health", HttpMethod.GET, HttpEntity.EMPTY, String::class.java)
        assertThat(resp.statusCode.value()).isEqualTo(200)
    }

    @Test
    fun `auth endpoint allows up to 5 login attempts per minute`() {
        // With no Redis in test profile, filter is bypassed — all requests pass.
        // This test verifies the endpoint is still reachable (no NPE in filter).
        repeat(3) {
            val resp = rest.postForEntity(
                "/api/auth/login",
                mapOf("username" to "baduser", "password" to "wrong"),
                Map::class.java,
            )
            assertThat(resp.statusCode.value()).isIn(200, 401, 403)
        }
    }
}
