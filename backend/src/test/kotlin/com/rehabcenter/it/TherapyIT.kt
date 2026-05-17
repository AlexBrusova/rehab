package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import com.rehabcenter.testsupport.bearerHeaders
import com.rehabcenter.testsupport.obtainToken
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod

class TherapyIT : AbstractIntegrationTest() {

    private fun therapistToken() = rest.obtainToken("therapist1", "1234")
    private fun managerToken() = rest.obtainToken("manager1", "1234")

    @Test
    fun `GET therapy sessions by house returns 2xx`() {
        val token = therapistToken()
        val res = rest.exchange(
            "/api/therapy?houseId=h1",
            HttpMethod.GET,
            HttpEntity<Void>(bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body).contains("ts-demo-1")
    }

    @Test
    fun `POST therapy creates session via legacy route with required fields`() {
        val token = therapistToken()
        val body = mapOf(
            "patientId" to "p1",
            "therapistId" to "u7",
            "topic" to "CBT session",
            "notes" to "Good progress",
            "urgency" to "NORMAL",
        )
        val res = rest.exchange(
            "/api/therapy",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
        assertThat(res.body!!["patientId"]).isEqualTo("p1")
        assertThat(res.body!!["therapistId"]).isEqualTo("u7")
    }

    @Test
    fun `POST therapy ignores unknown extra fields and returns 201`() {
        val token = therapistToken()
        val body = mapOf(
            "patientId" to "p1",
            "therapistId" to "u7",
            "topic" to "CBT session",
            // extra unknown fields:
            "id" to "some-id",
            "createdAt" to "2024-01-01T00:00:00Z",
            "updatedAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/therapy",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
    }

    @Test
    fun `GET therapy assignments by house returns 2xx`() {
        val token = therapistToken()
        val res = rest.exchange(
            "/api/therapy/assignments?houseId=h1",
            HttpMethod.GET,
            HttpEntity<Void>(bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body).contains("p1")
    }

    @Test
    fun `POST therapy assignments ignores unknown extra fields and returns 201`() {
        val token = therapistToken()
        // p31 has no assignment in seed, so we can create one
        val body = mapOf(
            "patientId" to "p31",
            "therapistId" to "u7",
            // extra unknown fields:
            "id" to "some-id",
            "createdAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/therapy/assignments",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
    }

    @Test
    fun `PATCH therapy assignments ignores unknown extra fields and returns 200`() {
        val token = therapistToken()
        val patchBody = mapOf(
            "therapistId" to "u7",
            // extra unknown fields:
            "patientId" to "p1",
            "createdAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/therapy/assignments/p1",
            HttpMethod.PATCH,
            HttpEntity(patchBody, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
    }

    @Test
    fun `GET therapy sessions by patientId returns 2xx`() {
        val token = therapistToken()
        val res = rest.exchange(
            "/api/therapy/sessions?patientId=p1",
            HttpMethod.GET,
            HttpEntity<Void>(bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body).contains("ts-demo-1")
    }

    @Test
    fun `POST therapy sessions ignores unknown extra fields and returns 201`() {
        val token = therapistToken()
        val body = mapOf(
            "patientId" to "p1",
            "therapistId" to "u7",
            "topic" to "Individual session",
            "notes" to "Progress noted",
            "urgency" to "NORMAL",
            // extra unknown fields:
            "id" to "some-id",
            "createdAt" to "2024-01-01T00:00:00Z",
            "counselorNote" to "Note from legacy",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/therapy/sessions",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
    }

    @Test
    fun `PATCH therapy sessions ignores unknown extra fields and returns 200`() {
        val token = therapistToken()
        val patchBody = mapOf(
            "topic" to "Updated topic",
            "notes" to "Updated notes",
            "urgency" to "URGENT",
            // extra unknown fields:
            "id" to "ts-demo-1",
            "createdAt" to "2024-01-01T00:00:00Z",
            "patientId" to "p1",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/therapy/sessions/ts-demo-1",
            HttpMethod.PATCH,
            HttpEntity(patchBody, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body!!["topic"]).isEqualTo("Updated topic")
    }
}
