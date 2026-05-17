package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import com.rehabcenter.testsupport.bearerHeaders
import com.rehabcenter.testsupport.obtainToken
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod

class GroupIT : AbstractIntegrationTest() {

    private fun managerToken() = rest.obtainToken("manager1", "1234")
    private fun counselorToken() = rest.obtainToken("counselor1", "1234")

    private fun validCreateBody(): Map<String, Any?> = mapOf(
        "houseId" to "h1",
        "date" to "2025-01-15",
        "topic" to "Morning circle",
        "leaderId" to "u4",
        "type" to "therapeutic",
        "time" to "09:00",
        "status" to "active",
        "attendance" to listOf(
            mapOf("patientId" to "p1", "status" to "present"),
            mapOf("patientId" to "p2", "status" to "absent"),
        ),
    )

    @Test
    fun `GET groups returns 2xx for valid houseId`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/groups?houseId=h1",
            HttpMethod.GET,
            HttpEntity<Void>(bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body).contains("g-demo-1")
    }

    @Test
    fun `POST groups creates group with required fields and attendance`() {
        val token = counselorToken()
        val res = rest.exchange(
            "/api/groups",
            HttpMethod.POST,
            HttpEntity(validCreateBody(), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
        assertThat(res.body!!["houseId"]).isEqualTo("h1")
        assertThat(res.body!!["topic"]).isEqualTo("Morning circle")
    }

    @Test
    fun `POST groups ignores unknown extra fields and returns 201`() {
        val token = counselorToken()
        val body = validCreateBody() + mapOf(
            "id" to "some-id",
            "createdAt" to "2024-01-01T00:00:00Z",
            "updatedAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/groups",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
    }

    @Test
    fun `POST groups returns 400 when required houseId is missing`() {
        val token = counselorToken()
        val body = mapOf(
            "date" to "2025-01-15",
            "topic" to "No house group",
        )
        val res = rest.exchange(
            "/api/groups",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
    }

    @Test
    fun `PATCH groups ignores unknown extra fields - does not return 400`() {
        val token = counselorToken()
        val patchBody = mapOf(
            "topic" to "Updated topic",
            "status" to "active",
            // extra unknown fields that must NOT cause 400:
            "id" to "g-demo-1",
            "createdAt" to "2024-01-01T00:00:00Z",
            "houseId" to "h1",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/groups/g-demo-1",
            HttpMethod.PATCH,
            HttpEntity(patchBody, bearerHeaders(token)),
            String::class.java,
        )
        // Verify unknown fields do NOT cause 400 Bad Request (that's the regression we're guarding)
        assertThat(res.statusCode.value()).isNotEqualTo(400)
    }

    @Test
    fun `PUT groups attendance ignores unknown extra fields and returns 200`() {
        val token = counselorToken()
        val body = mapOf(
            "patientId" to "p1",
            "status" to "present",
            // extra unknown fields:
            "id" to "some-id",
            "createdAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/groups/g-demo-1/attendance",
            HttpMethod.PUT,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
    }
}
