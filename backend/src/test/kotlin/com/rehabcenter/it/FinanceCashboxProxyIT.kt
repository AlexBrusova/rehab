package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import com.rehabcenter.testsupport.bearerHeaders
import com.rehabcenter.testsupport.obtainToken
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod

class FinanceCashboxProxyIT : AbstractIntegrationTest() {

    private fun managerToken() = rest.obtainToken("manager1", "1234")

    private fun validCashboxEntryBody(): Map<String, Any?> = mapOf(
        "houseId" to "h1",
        "type" to "withdrawal",
        "amount" to 200,
        "cat" to "Supplies",
        "note" to "Kitchen supplies",
        "date" to "01/01/2025",
        "time" to "11:00",
        "by" to "Amir Menachem",
        "balance" to 1800,
    )

    private fun validCashboxCountBody(): Map<String, Any?> = mapOf(
        "houseId" to "h1",
        "countedBy" to "Dana Katz",
        "amount" to 1800,
        "expected" to 1800,
        "diff" to 0,
        "date" to "01/01/2025",
        "time" to "20:00",
        "notes" to "Balanced",
    )

    @Test
    fun `GET finance cashbox returns 2xx for valid houseId`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/finance/cashbox?houseId=h1",
            HttpMethod.GET,
            HttpEntity<Void>(bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body).contains("cb-demo-1")
    }

    @Test
    fun `POST finance cashbox creates entry with required fields`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/finance/cashbox",
            HttpMethod.POST,
            HttpEntity(validCashboxEntryBody(), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
        assertThat(res.body!!["type"]).isEqualTo("withdrawal")
    }

    @Test
    fun `POST finance cashbox ignores unknown extra fields and returns 201`() {
        val token = managerToken()
        val body = validCashboxEntryBody() + mapOf(
            "id" to "some-id",
            "createdAt" to "2024-01-01T00:00:00Z",
            "updatedAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/finance/cashbox",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
    }

    @Test
    fun `GET finance cashbox counts returns 2xx for valid houseId`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/finance/cashbox-counts?houseId=h1",
            HttpMethod.GET,
            HttpEntity<Void>(bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body).contains("cbc-demo-1")
    }

    @Test
    fun `POST finance cashbox counts creates count entry`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/finance/cashbox-counts",
            HttpMethod.POST,
            HttpEntity(validCashboxCountBody(), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
        assertThat(res.body!!["countedBy"]).isEqualTo("Dana Katz")
    }

    @Test
    fun `POST finance cashbox counts ignores unknown extra fields and returns 201`() {
        val token = managerToken()
        val body = validCashboxCountBody() + mapOf(
            "id" to "some-id",
            "createdAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/finance/cashbox-counts",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
    }
}
