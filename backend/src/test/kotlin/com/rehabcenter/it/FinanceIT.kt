package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import com.rehabcenter.testsupport.bearerHeaders
import com.rehabcenter.testsupport.obtainToken
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod

class FinanceIT : AbstractIntegrationTest() {

    private fun managerToken() = rest.obtainToken("manager1", "1234")

    private fun validFinanceBody(
        patientId: String = "p1",
        type: String = "deposit",
        amount: Int? = 100,
        balance: Int? = 100,
        date: String = "01/01/2025",
    ): Map<String, Any?> =
        mapOf(
            "patientId" to patientId,
            "type" to type,
            "amount" to amount,
            "balance" to balance,
            "date" to date,
        )

    @Test
    fun `should create finance record with all required fields`() {
        val token = managerToken()
        val res =
            rest.exchange(
                "/api/finance",
                HttpMethod.POST,
                HttpEntity(validFinanceBody(), bearerHeaders(token)),
                object : ParameterizedTypeReference<Map<String, Any?>>() {},
            )
        assertThat(res.statusCode.value()).isEqualTo(201)
    }

    @Test
    fun `should reject POST finance without amount - regression for review-1`() {
        val token = managerToken()
        val body = validFinanceBody(amount = null)
        val res =
            rest.exchange(
                "/api/finance",
                HttpMethod.POST,
                HttpEntity(body, bearerHeaders(token)),
                object : ParameterizedTypeReference<Map<String, Any?>>() {},
            )
        assertThat(res.statusCode.value()).isEqualTo(400)
    }

    @Test
    fun `should reject POST finance without balance - regression for review-1`() {
        val token = managerToken()
        val body = validFinanceBody(balance = null)
        val res =
            rest.exchange(
                "/api/finance",
                HttpMethod.POST,
                HttpEntity(body, bearerHeaders(token)),
                object : ParameterizedTypeReference<Map<String, Any?>>() {},
            )
        assertThat(res.statusCode.value()).isEqualTo(400)
    }

    @Test
    fun `POST finance ignores unknown extra fields and returns 201`() {
        val token = managerToken()
        val body = validFinanceBody() + mapOf(
            "id" to "some-id",
            "createdAt" to "2024-01-01T00:00:00Z",
            "updatedAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
        )
        val res =
            rest.exchange(
                "/api/finance",
                HttpMethod.POST,
                HttpEntity(body, bearerHeaders(token)),
                object : ParameterizedTypeReference<Map<String, Any?>>() {},
            )
        assertThat(res.statusCode.value()).isEqualTo(201)
    }

    @Test
    fun `GET finance list by patientId returns 2xx`() {
        val token = managerToken()
        val res =
            rest.exchange(
                "/api/finance?patientId=p1",
                HttpMethod.GET,
                HttpEntity<Void>(bearerHeaders(token)),
                String::class.java,
            )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body).contains("f-p1-001")
    }

    @Test
    fun `GET finance patient by houseId returns 2xx`() {
        val token = managerToken()
        val res =
            rest.exchange(
                "/api/finance/patient?houseId=h1",
                HttpMethod.GET,
                HttpEntity<Void>(bearerHeaders(token)),
                String::class.java,
            )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
    }

    @Test
    fun `POST finance patient ignores unknown extra fields and returns 201`() {
        val token = managerToken()
        val body = validFinanceBody() + mapOf(
            "id" to "some-id",
            "createdAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
        )
        val res =
            rest.exchange(
                "/api/finance/patient",
                HttpMethod.POST,
                HttpEntity(body, bearerHeaders(token)),
                object : ParameterizedTypeReference<Map<String, Any?>>() {},
            )
        assertThat(res.statusCode.value()).isEqualTo(201)
    }
}
