package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import com.rehabcenter.testsupport.bearerHeaders
import com.rehabcenter.testsupport.obtainToken
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod
import java.time.LocalDate

/**
 * Регрессия контракта legacy Express API, который использует текущий React (`rehab/app`).
 * Покрывает маршруты, добавленные при слиянии с `rehab-master-my`.
 */
class LegacyExpressApiIT : AbstractIntegrationTest() {
    private val todayIso: String
        get() = LocalDate.now().toString()

    @Test
    fun `therapist assignments map and put`() {
        val token = rest.obtainToken("manager1", "1234")
        val headers = bearerHeaders(token)
        val getRes =
            rest.exchange(
                "/api/therapist-assignments?houseId=h1",
                HttpMethod.GET,
                HttpEntity<Void>(headers),
                object : ParameterizedTypeReference<Map<String, String>>() {},
            )
        assertThat(getRes.statusCode.is2xxSuccessful).isTrue()
        assertThat(getRes.body!!["p1"]).isEqualTo("u7")

        val putRes =
            rest.exchange(
                "/api/therapist-assignments",
                HttpMethod.PUT,
                HttpEntity(mapOf("patientId" to "p2", "therapistId" to "u7"), headers),
                object : ParameterizedTypeReference<Map<String, Any?>>() {},
            )
        assertThat(putRes.statusCode.is2xxSuccessful).isTrue()
        assertThat(putRes.body!!["patientId"]).isEqualTo("p2")
        assertThat(putRes.body!!["therapistId"]).isEqualTo("u7")

        val after =
            rest.exchange(
                "/api/therapist-assignments?houseId=h1",
                HttpMethod.GET,
                HttpEntity<Void>(headers),
                object : ParameterizedTypeReference<Map<String, String>>() {},
            )
        assertThat(after.body!!["p2"]).isEqualTo("u7")
    }

    @Test
    fun `shift distributions get and put`() {
        val token = rest.obtainToken("manager1", "1234")
        val headers = bearerHeaders(token)
        val getRes =
            rest.exchange(
                "/api/distributions?houseId=h1&date=$todayIso",
                HttpMethod.GET,
                HttpEntity<Void>(headers),
                object : ParameterizedTypeReference<List<Map<String, Any?>>>() {},
            )
        assertThat(getRes.statusCode.is2xxSuccessful).isTrue()

        val putRes =
            rest.exchange(
                "/api/distributions",
                HttpMethod.PUT,
                HttpEntity(
                    mapOf("patientId" to "p1", "shift" to "morning", "date" to todayIso, "status" to "given"),
                    headers,
                ),
                object : ParameterizedTypeReference<Map<String, Any?>>() {},
            )
        assertThat(putRes.statusCode.is2xxSuccessful).isTrue()
        assertThat(putRes.body!!["patientId"]).isEqualTo("p1")
        assertThat(putRes.body!!["status"]).isEqualTo("given")

        val list =
            rest.exchange(
                "/api/distributions?houseId=h1&date=$todayIso",
                HttpMethod.GET,
                HttpEntity<Void>(headers),
                object : ParameterizedTypeReference<List<Map<String, Any?>>>() {},
            )
        assertThat(list.body!!.any { it["patientId"] == "p1" && it["shift"] == "morning" }).isTrue()
    }

    @Test
    fun `finance patient by house`() {
        val token = rest.obtainToken("manager1", "1234")
        val res =
            rest.exchange(
                "/api/finance/patient?houseId=h1",
                HttpMethod.GET,
                HttpEntity<Void>(bearerHeaders(token)),
                object : ParameterizedTypeReference<List<Map<String, Any?>>>() {},
            )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body!!.isNotEmpty()).isTrue()
        val first = res.body!!.first()
        assertThat(first.keys).contains("source", "cat")
    }

    @Test
    fun `summary compat get and post`() {
        val token = rest.obtainToken("manager1", "1234")
        val headers = bearerHeaders(token)
        val getRes =
            rest.exchange(
                "/api/summary?houseId=h1",
                HttpMethod.GET,
                HttpEntity<Void>(headers),
                object : ParameterizedTypeReference<List<Map<String, Any?>>>() {},
            )
        assertThat(getRes.statusCode.is2xxSuccessful).isTrue()

        val postRes =
            rest.exchange(
                "/api/summary",
                HttpMethod.POST,
                HttpEntity(
                    mapOf(
                        "houseId" to "h1",
                        "counselorId" to "u4",
                        "generalText" to "IT summary line",
                        "patientSummaries" to mapOf("p1" to "OK"),
                    ),
                    headers,
                ),
                object : ParameterizedTypeReference<Map<String, Any?>>() {},
            )
        assertThat(postRes.statusCode.value()).isEqualTo(201)
        assertThat(postRes.body!!["houseId"]).isEqualTo("h1")
    }

    @Test
    fun `schedule assign put`() {
        val token = rest.obtainToken("manager1", "1234")
        val headers = bearerHeaders(token)
        val date = "2099-01-15"
        val res =
            rest.exchange(
                "/api/schedule/assign",
                HttpMethod.PUT,
                HttpEntity(
                    mapOf("houseId" to "h1", "date" to date, "counselorId" to "u4", "note" to "from IT"),
                    headers,
                ),
                object : ParameterizedTypeReference<Map<String, Any?>>() {},
            )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body!!["shift"] as String).isEqualTo("24h")
        assertThat(res.body!!["counselorId"]).isEqualTo("u4")

        val clear =
            rest.exchange(
                "/api/schedule/assign",
                HttpMethod.PUT,
                HttpEntity(mapOf("houseId" to "h1", "date" to date, "counselorId" to null), headers),
                Void::class.java,
            )
        assertThat(clear.statusCode.is2xxSuccessful).isTrue()
    }

    @Test
    fun `therapy list by house and legacy post`() {
        val token = rest.obtainToken("therapist1", "1234")
        val headers = bearerHeaders(token)
        val listRes =
            rest.exchange(
                "/api/therapy?houseId=h1",
                HttpMethod.GET,
                HttpEntity<Void>(headers),
                object : ParameterizedTypeReference<List<Map<String, Any?>>>() {},
            )
        assertThat(listRes.statusCode.is2xxSuccessful).isTrue()
        assertThat(listRes.body!!.isNotEmpty()).isTrue()

        val postRes =
            rest.exchange(
                "/api/therapy",
                HttpMethod.POST,
                HttpEntity(
                    mapOf(
                        "patientId" to "p1",
                        "therapistId" to "u7",
                        "topic" to "IT session topic",
                        "notes" to "n",
                        "counselorNote" to "",
                        "urgency" to "ATTENTION",
                    ),
                    headers,
                ),
                object : ParameterizedTypeReference<Map<String, Any?>>() {},
            )
        assertThat(postRes.statusCode.value()).isEqualTo(201)
        assertThat(postRes.body!!["patientId"]).isEqualTo("p1")
        assertThat(postRes.body!!["urgency"]).isEqualTo("ATTENTION")
    }

    @Test
    fun `groups put attendance`() {
        val token = rest.obtainToken("manager1", "1234")
        val headers = bearerHeaders(token)
        val res =
            rest.exchange(
                "/api/groups/g-demo-1/attendance",
                HttpMethod.PUT,
                HttpEntity(mapOf("patientId" to "p1", "status" to "absent"), headers),
                object : ParameterizedTypeReference<Map<String, Any?>>() {},
            )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body!!["status"]).isEqualTo("absent")
        assertThat(res.body!!["sessionId"]).isEqualTo("g-demo-1")
    }
}
