package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import com.rehabcenter.testsupport.bearerHeaders
import com.rehabcenter.testsupport.obtainToken
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod

class DailySummaryIT : AbstractIntegrationTest() {

    private fun counselorToken() = rest.obtainToken("counselor1", "1234")
    private fun managerToken() = rest.obtainToken("manager1", "1234")

    private fun validCreateBody(): Map<String, Any?> = mapOf(
        "counselorId" to "u4",
        "houseId" to "h1",
        "date" to "01/01",
        "generalText" to "All went well today",
        "patientSummaries" to mapOf("p1" to "Good session", "p2" to "Struggling"),
        "notifiedAt" to "20:00",
    )

    @Test
    fun `GET summaries returns 2xx for valid houseId`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/summaries?houseId=h1",
            HttpMethod.GET,
            HttpEntity<Void>(bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body).contains("ds-demo-1")
    }

    @Test
    fun `POST summaries creates daily summary with required fields`() {
        val token = counselorToken()
        val res = rest.exchange(
            "/api/summaries",
            HttpMethod.POST,
            HttpEntity(validCreateBody(), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
        assertThat(res.body!!["houseId"]).isEqualTo("h1")
        assertThat(res.body!!["counselorId"]).isEqualTo("u4")
    }

    @Test
    fun `POST summaries ignores unknown extra fields and returns 201`() {
        val token = counselorToken()
        val body = validCreateBody() + mapOf(
            "id" to "some-id",
            "createdAt" to "2024-01-01T00:00:00Z",
            "updatedAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/summaries",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
    }

    @Test
    fun `POST summaries returns 400 when required counselorId is missing`() {
        val token = counselorToken()
        val body = mapOf(
            "houseId" to "h1",
            "date" to "01/01",
            "generalText" to "All went well",
        )
        val res = rest.exchange(
            "/api/summaries",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
    }

    @Test
    fun `PATCH summaries ignores unknown extra fields and returns 200`() {
        val token = counselorToken()
        val patchBody = mapOf(
            "generalText" to "Updated general text",
            "notifiedAt" to "21:00",
            // extra unknown fields:
            "id" to "ds-demo-1",
            "createdAt" to "2024-01-01T00:00:00Z",
            "counselorId" to "u4",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/summaries/ds-demo-1",
            HttpMethod.PATCH,
            HttpEntity(patchBody, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body!!["generalText"]).isEqualTo("Updated general text")
    }
}
