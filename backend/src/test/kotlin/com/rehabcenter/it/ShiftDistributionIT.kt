package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import com.rehabcenter.testsupport.bearerHeaders
import com.rehabcenter.testsupport.obtainToken
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod

class ShiftDistributionIT : AbstractIntegrationTest() {

    private fun counselorToken() = rest.obtainToken("counselor1", "1234")
    private fun managerToken() = rest.obtainToken("manager1", "1234")

    private fun validUpsertBody(patientId: String = "p1"): Map<String, Any?> = mapOf(
        "patientId" to patientId,
        "shift" to "morning",
        "date" to "2025-01-01",
        "status" to "present",
    )

    @Test
    fun `GET distributions returns 2xx for valid houseId and date`() {
        val token = counselorToken()
        val res = rest.exchange(
            "/api/distributions?houseId=h1&date=2025-01-01",
            HttpMethod.GET,
            HttpEntity<Void>(bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
    }

    @Test
    fun `PUT distributions upserts shift distribution with required fields`() {
        val token = counselorToken()
        val res = rest.exchange(
            "/api/distributions",
            HttpMethod.PUT,
            HttpEntity(validUpsertBody(), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body!!["patientId"]).isEqualTo("p1")
        assertThat(res.body!!["shift"]).isEqualTo("morning")
    }

    @Test
    fun `PUT distributions ignores unknown extra fields and returns 2xx`() {
        val token = counselorToken()
        val body = validUpsertBody() + mapOf(
            "id" to "some-id",
            "createdAt" to "2024-01-01T00:00:00Z",
            "updatedAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
            "houseId" to "h1",
        )
        val res = rest.exchange(
            "/api/distributions",
            HttpMethod.PUT,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
    }

    @Test
    fun `PUT distributions returns 400 when required field patientId is missing`() {
        val token = counselorToken()
        val body = mapOf(
            "shift" to "morning",
            "date" to "2025-01-01",
        )
        val res = rest.exchange(
            "/api/distributions",
            HttpMethod.PUT,
            HttpEntity(body, bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
    }

    @Test
    fun `PUT distributions updates existing shift distribution (idempotent)`() {
        val token = counselorToken()
        // First upsert
        rest.exchange(
            "/api/distributions",
            HttpMethod.PUT,
            HttpEntity(validUpsertBody("p2"), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        // Second upsert with same key but different status
        val body = validUpsertBody("p2") + mapOf("status" to "absent")
        val res = rest.exchange(
            "/api/distributions",
            HttpMethod.PUT,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body!!["status"]).isEqualTo("absent")
    }
}
