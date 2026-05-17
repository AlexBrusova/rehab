package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import com.rehabcenter.testsupport.bearerHeaders
import com.rehabcenter.testsupport.obtainToken
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod

class MedDistributionIT : AbstractIntegrationTest() {

    private fun counselorToken() = rest.obtainToken("counselor1", "1234")
    private fun managerToken() = rest.obtainToken("manager1", "1234")

    private fun validCreateBody(medId: String = "m1"): Map<String, Any?> = mapOf(
        "patientId" to "p1",
        "medId" to medId,
        "date" to "01/01/2025",
        "time" to "08:00",
        "given" to false,
    )

    @Test
    fun `GET med distributions returns 2xx for valid patientId and date`() {
        val token = counselorToken()
        val res = rest.exchange(
            "/api/med-distributions?patientId=p1&date=01/01/2025",
            HttpMethod.GET,
            HttpEntity<Void>(bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
    }

    @Test
    fun `POST med distributions creates distribution for existing med`() {
        val token = counselorToken()
        val res = rest.exchange(
            "/api/med-distributions",
            HttpMethod.POST,
            HttpEntity(validCreateBody(), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
        assertThat(res.body!!["patientId"]).isEqualTo("p1")
        assertThat(res.body!!["medId"]).isEqualTo("m1")
        assertThat(res.body!!["given"]).isEqualTo(false)
    }

    @Test
    fun `POST med distributions ignores unknown extra fields and returns 201`() {
        val token = counselorToken()
        val body = validCreateBody() + mapOf(
            "id" to "some-id",
            "createdAt" to "2024-01-01T00:00:00Z",
            "updatedAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/med-distributions",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
    }

    @Test
    fun `POST med distributions returns 400 when required field is missing`() {
        val token = counselorToken()
        val body = mapOf(
            "patientId" to "p1",
            "date" to "01/01/2025",
            "time" to "08:00",
            // missing medId
        )
        val res = rest.exchange(
            "/api/med-distributions",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
    }

    @Test
    fun `PATCH med distributions ignores unknown extra fields and returns 200`() {
        // First create a distribution to patch
        val token = counselorToken()
        val createRes = rest.exchange(
            "/api/med-distributions",
            HttpMethod.POST,
            HttpEntity(validCreateBody(), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        val distId = createRes.body!!["id"] as String

        val patchBody = mapOf(
            "given" to true,
            "givenAt" to "08:05",
            "givenBy" to "Amir Menachem",
            // extra unknown fields:
            "id" to distId,
            "createdAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/med-distributions/$distId",
            HttpMethod.PATCH,
            HttpEntity(patchBody, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body!!["given"]).isEqualTo(true)
    }
}
