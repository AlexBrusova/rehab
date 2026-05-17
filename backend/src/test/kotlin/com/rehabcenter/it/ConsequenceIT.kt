package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import com.rehabcenter.testsupport.bearerHeaders
import com.rehabcenter.testsupport.obtainToken
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod

class ConsequenceIT : AbstractIntegrationTest() {

    private fun managerToken() = rest.obtainToken("manager1", "1234")

    private fun validCreateBody(): Map<String, Any?> = mapOf(
        "patientId" to "p1",
        "houseId" to "h1",
        "type" to "verbal_warning",
        "description" to "Test consequence description",
        "date" to "01/01/2025",
    )

    @Test
    fun `GET consequences returns 2xx for valid houseId`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/consequences?houseId=h1",
            HttpMethod.GET,
            HttpEntity<Void>(bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body).contains("c-demo-1")
    }

    @Test
    fun `GET consequences returns 2xx without houseId filter`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/consequences",
            HttpMethod.GET,
            HttpEntity<Void>(bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
    }

    @Test
    fun `POST consequences creates consequence with required fields`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/consequences",
            HttpMethod.POST,
            HttpEntity(validCreateBody(), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
        assertThat(res.body!!["status"]).isEqualTo("pending")
        assertThat(res.body!!["type"]).isEqualTo("verbal_warning")
    }

    @Test
    fun `POST consequences ignores unknown extra fields and returns 201`() {
        val token = managerToken()
        val body = validCreateBody() + mapOf(
            "id" to "some-id",
            "createdAt" to "2024-01-01T00:00:00Z",
            "updatedAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
            "approvedBy" to "someone",
        )
        val res = rest.exchange(
            "/api/consequences",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
    }

    @Test
    fun `POST consequences returns 400 when required field is missing`() {
        val token = managerToken()
        val body = mapOf(
            "houseId" to "h1",
            "type" to "verbal_warning",
            "description" to "Test",
            "date" to "01/01/2025",
            // missing patientId
        )
        val res = rest.exchange(
            "/api/consequences",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
    }

    @Test
    fun `PATCH consequences ignores unknown extra fields and returns 200`() {
        val token = managerToken()
        // Use the seeded consequence c-demo-1
        val patchBody = mapOf(
            "status" to "approved",
            "approvedBy" to "manager1",
            // extra unknown fields:
            "id" to "c-demo-1",
            "createdAt" to "2024-01-01T00:00:00Z",
            "patientId" to "p1",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/consequences/c-demo-1",
            HttpMethod.PATCH,
            HttpEntity(patchBody, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body!!["status"]).isEqualTo("approved")
    }
}
