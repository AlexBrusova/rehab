package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import com.rehabcenter.testsupport.bearerHeaders
import com.rehabcenter.testsupport.obtainToken
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod

class AbsenceIT : AbstractIntegrationTest() {

    private fun managerToken() = rest.obtainToken("manager1", "1234")

    @Test
    fun `GET absences returns 2xx for valid houseId`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/absences?houseId=h1",
            HttpMethod.GET,
            HttpEntity<Void>(bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
    }

    @Test
    fun `POST absences creates absence with required fields`() {
        val token = managerToken()
        val body = mapOf(
            "patientId" to "p1",
            "houseId" to "h1",
            "type" to "hospital",
            "startDate" to "01/01/2025",
            "endDate" to "05/01/2025",
        )
        val res = rest.exchange(
            "/api/absences",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
        assertThat(res.body!!["status"]).isEqualTo("pending")
    }

    @Test
    fun `POST absences ignores unknown extra fields and returns 201`() {
        val token = managerToken()
        val body = mapOf(
            "patientId" to "p1",
            "houseId" to "h1",
            "type" to "leave",
            "startDate" to "10/01/2025",
            "endDate" to "12/01/2025",
            // extra fields that UI might send:
            "id" to "some-id",
            "createdAt" to "2024-01-01T00:00:00Z",
            "updatedAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
            "status" to "approved",
        )
        val res = rest.exchange(
            "/api/absences",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
    }

    @Test
    fun `POST absences returns 400 when required field patientId is missing`() {
        val token = managerToken()
        val body = mapOf(
            "houseId" to "h1",
            "type" to "leave",
            "startDate" to "10/01/2025",
            "endDate" to "12/01/2025",
        )
        val res = rest.exchange(
            "/api/absences",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
    }

    @Test
    fun `PATCH absences ignores unknown extra fields and returns 200`() {
        // First create an absence
        val token = managerToken()
        val createBody = mapOf(
            "patientId" to "p1",
            "houseId" to "h1",
            "type" to "leave",
            "startDate" to "15/01/2025",
            "endDate" to "20/01/2025",
        )
        val createRes = rest.exchange(
            "/api/absences",
            HttpMethod.POST,
            HttpEntity(createBody, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        val absenceId = createRes.body!!["id"] as String

        val patchBody = mapOf(
            "status" to "approved",
            "approvedBy" to "manager1",
            // extra unknown fields:
            "id" to absenceId,
            "createdAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/absences/$absenceId",
            HttpMethod.PATCH,
            HttpEntity(patchBody, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body!!["status"]).isEqualTo("approved")
    }
}
