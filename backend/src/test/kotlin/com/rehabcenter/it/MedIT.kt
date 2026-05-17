package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import com.rehabcenter.testsupport.bearerHeaders
import com.rehabcenter.testsupport.obtainToken
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod

class MedIT : AbstractIntegrationTest() {

    private fun doctorToken() = rest.obtainToken("doctor1", "1234")
    private fun managerToken() = rest.obtainToken("manager1", "1234")

    private fun validCreateBody(patientId: String = "p1"): Map<String, Any?> = mapOf(
        "patientId" to patientId,
        "name" to "Aspirin",
        "dose" to "100",
        "unit" to "mg",
        "times" to listOf("morning"),
        "prescribedBy" to "Dr. Sarah Levi",
        "notes" to "Take with food",
    )

    @Test
    fun `GET meds returns 2xx for valid patientId`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/meds?patientId=p1",
            HttpMethod.GET,
            HttpEntity<Void>(bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body).contains("m1")
    }

    @Test
    fun `POST meds creates medication with required fields`() {
        val token = doctorToken()
        val res = rest.exchange(
            "/api/meds",
            HttpMethod.POST,
            HttpEntity(validCreateBody(), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
        assertThat(res.body!!["name"]).isEqualTo("Aspirin")
        assertThat(res.body!!["patientId"]).isEqualTo("p1")
    }

    @Test
    fun `POST meds ignores unknown extra fields and returns 201`() {
        val token = doctorToken()
        val body = validCreateBody() + mapOf(
            "id" to "some-id",
            "createdAt" to "2024-01-01T00:00:00Z",
            "updatedAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/meds",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
    }

    @Test
    fun `POST meds returns 400 when required name is missing`() {
        val token = doctorToken()
        val body = mapOf(
            "patientId" to "p1",
            "dose" to "100",
        )
        val res = rest.exchange(
            "/api/meds",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
    }

    @Test
    fun `PATCH meds ignores unknown extra fields and returns 200`() {
        val token = doctorToken()
        val patchBody = mapOf(
            "name" to "Methadone Updated",
            "dose" to "45",
            // extra unknown fields:
            "id" to "m1",
            "createdAt" to "2024-01-01T00:00:00Z",
            "patientId" to "p1",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/meds/m1",
            HttpMethod.PATCH,
            HttpEntity(patchBody, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body!!["name"]).isEqualTo("Methadone Updated")
    }

    @Test
    fun `DELETE meds returns 200 for existing med`() {
        // First create a med to delete
        val token = doctorToken()
        val createRes = rest.exchange(
            "/api/meds",
            HttpMethod.POST,
            HttpEntity(validCreateBody("p2"), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        val medId = createRes.body!!["id"] as String

        val deleteRes = rest.exchange(
            "/api/meds/$medId",
            HttpMethod.DELETE,
            HttpEntity<Void>(bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(deleteRes.statusCode.is2xxSuccessful).isTrue()
    }

    @Test
    fun `DELETE meds returns 404 for non-existent med`() {
        val token = doctorToken()
        val res = rest.exchange(
            "/api/meds/non-existent-id",
            HttpMethod.DELETE,
            HttpEntity<Void>(bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.value()).isEqualTo(404)
    }
}
