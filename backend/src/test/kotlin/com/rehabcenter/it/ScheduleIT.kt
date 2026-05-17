package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import com.rehabcenter.testsupport.bearerHeaders
import com.rehabcenter.testsupport.obtainToken
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod

class ScheduleIT : AbstractIntegrationTest() {

    private fun managerToken() = rest.obtainToken("manager1", "1234")
    private fun orgManagerToken() = rest.obtainToken("org_manager1", "1234")

    private fun validCreateBody(): Map<String, Any?> = mapOf(
        "houseId" to "h1",
        "counselorId" to "u4",
        "date" to "2025-06-01",
        "shiftType" to "24h",
        "note" to "Test schedule",
    )

    @Test
    fun `GET schedule returns 2xx for valid houseId`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/schedule?houseId=h1",
            HttpMethod.GET,
            HttpEntity<Void>(bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
    }

    @Test
    fun `POST schedule creates schedule entry with required fields`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/schedule",
            HttpMethod.POST,
            HttpEntity(validCreateBody(), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
        assertThat(res.body!!["houseId"]).isEqualTo("h1")
        assertThat(res.body!!["counselorId"]).isEqualTo("u4")
    }

    @Test
    fun `POST schedule ignores unknown extra fields and returns 201`() {
        val token = managerToken()
        val body = validCreateBody() + mapOf(
            "id" to "some-id",
            "createdAt" to "2024-01-01T00:00:00Z",
            "updatedAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/schedule",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
    }

    @Test
    fun `POST schedule returns 400 when required field is missing`() {
        val token = managerToken()
        val body = mapOf(
            "counselorId" to "u4",
            "date" to "2025-06-01",
            // missing houseId
        )
        val res = rest.exchange(
            "/api/schedule",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
    }

    @Test
    fun `DELETE schedule returns 200 for existing entry`() {
        val token = managerToken()
        // First create a schedule entry
        val createRes = rest.exchange(
            "/api/schedule",
            HttpMethod.POST,
            HttpEntity(validCreateBody(), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        val scheduleId = createRes.body!!["id"] as String

        val deleteRes = rest.exchange(
            "/api/schedule/$scheduleId",
            HttpMethod.DELETE,
            HttpEntity<Void>(bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(deleteRes.statusCode.is2xxSuccessful).isTrue()
    }

    @Test
    fun `PUT schedule assign ignores unknown extra fields and returns 200`() {
        val token = managerToken()
        val body = mapOf(
            "houseId" to "h1",
            "date" to "2025-07-01",
            "counselorId" to "u5",
            "note" to "Assigned via legacy",
            // extra unknown fields:
            "id" to "some-id",
            "createdAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/schedule/assign",
            HttpMethod.PUT,
            HttpEntity(body, bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
    }
}
