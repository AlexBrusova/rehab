package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod

class IdempotencyIT : AbstractIntegrationTest() {

    @Test
    fun `request without idempotency key is allowed through`() {
        // No X-Idempotency-Key — filter must not block the request
        val headers = HttpHeaders().apply {
            set("Authorization", "Bearer ${login()}")
            set("Content-Type", "application/json")
        }
        // POST to patients without idempotency key — filter passes through to controller
        val resp = rest.exchange(
            "/api/patients?houseId=house1",
            HttpMethod.POST,
            HttpEntity("{}", headers),
            String::class.java,
        )
        // Controller may return 400 (validation) but NOT 5xx from filter failure
        assertThat(resp.statusCode.value()).isLessThan(500)
    }

    private fun login(): String {
        val resp = rest.postForEntity(
            "/api/auth/login",
            mapOf("username" to "org_manager1", "password" to "1234"),
            Map::class.java,
        )
        return resp.body!!["token"] as String
    }
}
