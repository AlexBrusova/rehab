package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import com.rehabcenter.testsupport.bearerHeaders
import com.rehabcenter.testsupport.obtainToken
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod

class CashboxIT : AbstractIntegrationTest() {

    private fun managerToken() = rest.obtainToken("manager1", "1234")

    private fun validEntryBody(houseId: String = "h1"): Map<String, Any?> = mapOf(
        "houseId" to houseId,
        "type" to "deposit",
        "amount" to 500,
        "cat" to "Family",
        "note" to "Test deposit",
        "date" to "01/01/2025",
        "time" to "10:00",
        "by" to "Dana Katz",
        "balance" to 500,
    )

    private fun validCountBody(houseId: String = "h1"): Map<String, Any?> = mapOf(
        "houseId" to houseId,
        "countedBy" to "Dana Katz",
        "amount" to 1000,
        "expected" to 1000,
        "diff" to 0,
        "date" to "01/01/2025",
        "time" to "20:00",
        "notes" to "All good",
    )

    @Test
    fun `GET cashbox entries returns 2xx for valid houseId`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/cashbox?houseId=h1",
            HttpMethod.GET,
            HttpEntity<Void>(bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body).contains("cb-demo-1")
    }

    @Test
    fun `POST cashbox creates entry with required fields`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/cashbox",
            HttpMethod.POST,
            HttpEntity(validEntryBody(), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
        assertThat(res.body!!["type"]).isEqualTo("deposit")
    }

    @Test
    fun `POST cashbox ignores unknown extra fields and returns 201`() {
        val token = managerToken()
        val body = validEntryBody() + mapOf(
            "id" to "some-id",
            "createdAt" to "2024-01-01T00:00:00Z",
            "updatedAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/cashbox",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
    }

    @Test
    fun `GET cashbox counts returns 2xx for valid houseId`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/cashbox/counts?houseId=h1",
            HttpMethod.GET,
            HttpEntity<Void>(bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body).contains("cbc-demo-1")
    }

    @Test
    fun `POST cashbox counts creates count with required fields`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/cashbox/counts",
            HttpMethod.POST,
            HttpEntity(validCountBody(), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
        assertThat(res.body!!["countedBy"]).isEqualTo("Dana Katz")
    }

    @Test
    fun `POST cashbox counts ignores unknown extra fields and returns 201`() {
        val token = managerToken()
        val body = validCountBody() + mapOf(
            "id" to "some-id",
            "createdAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/cashbox/counts",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
    }
}
