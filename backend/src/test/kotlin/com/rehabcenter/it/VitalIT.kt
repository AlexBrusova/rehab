package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import com.rehabcenter.testsupport.bearerHeaders
import com.rehabcenter.testsupport.obtainToken
import com.rehabcenter.validation.UiValidation
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod

class VitalIT : AbstractIntegrationTest() {

    private fun doctorToken() = rest.obtainToken("doctor1", "1234")

    private fun validCreateBody(): Map<String, Any?> = mapOf(
        "patientId" to "p1",
        "houseId" to "h1",
        "systolic" to 138,
        "diastolic" to 90,
        "pulse" to 80,
        "note" to "Borderline pressure - monitor",
        "date" to "01/01/2025",
    )

    @Test
    fun `POST vitals creates a vital record with all fields`() {
        val token = doctorToken()
        val res = rest.exchange(
            "/api/vitals",
            HttpMethod.POST,
            HttpEntity(validCreateBody(), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
        assertThat(res.body!!["systolic"]).isEqualTo(138)
        assertThat(res.body!!["diastolic"]).isEqualTo(90)
        assertThat(res.body!!["pulse"]).isEqualTo(80)
        assertThat(res.body!!["note"]).isEqualTo("Borderline pressure - monitor")
    }

    @Test
    fun `POST vitals ignores unknown extra fields and returns 201`() {
        val token = doctorToken()
        val body = validCreateBody() + mapOf(
            "id" to "some-id",
            "createdAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/vitals",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
    }

    @Test
    fun `POST vitals returns 400 when systolic is missing`() {
        val token = doctorToken()
        val body = validCreateBody() - "systolic"
        val res = rest.exchange(
            "/api/vitals",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
    }

    @Test
    fun `POST vitals returns 400 when pulse is out of range`() {
        val token = doctorToken()
        val body = validCreateBody() + mapOf("pulse" to 500)
        val res = rest.exchange(
            "/api/vitals",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
    }

    @Test
    fun `GET vitals returns created record ordered newest first`() {
        val token = doctorToken()
        rest.exchange(
            "/api/vitals",
            HttpMethod.POST,
            HttpEntity(validCreateBody(), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        rest.exchange(
            "/api/vitals",
            HttpMethod.POST,
            HttpEntity(validCreateBody() + mapOf("date" to "02/01/2025"), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        val res = rest.exchange(
            "/api/vitals?houseId=h1",
            HttpMethod.GET,
            HttpEntity<Void>(bearerHeaders(token)),
            object : ParameterizedTypeReference<List<Map<String, Any?>>>() {},
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        val dates = res.body!!.map { it["date"] }
        assertThat(dates).containsExactly("02/01/2025", "01/01/2025")

        val newest = res.body!!.first()
        assertThat(newest["systolic"]).isEqualTo(138)
        assertThat(newest["diastolic"]).isEqualTo(90)
        assertThat(newest["pulse"]).isEqualTo(80)
        assertThat(newest["note"]).isEqualTo("Borderline pressure - monitor")
    }

    @Test
    fun `POST vitals returns 400 when date is missing`() {
        val token = doctorToken()
        val body = validCreateBody() - "date"
        val res = rest.exchange(
            "/api/vitals",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
    }

    @Test
    fun `POST vitals returns 400 when diastolic is out of range`() {
        val token = doctorToken()
        val body = validCreateBody() + mapOf("diastolic" to 500)
        val res = rest.exchange(
            "/api/vitals",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
    }

    @Test
    fun `POST vitals returns 400 when note exceeds max length`() {
        val token = doctorToken()
        val body = validCreateBody() + mapOf("note" to "a".repeat(UiValidation.NOTE_MAX + 1))
        val res = rest.exchange(
            "/api/vitals",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
    }

    @Test
    fun `GET vitals requires houseId`() {
        val token = doctorToken()
        val res = rest.exchange(
            "/api/vitals",
            HttpMethod.GET,
            HttpEntity<Void>(bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
    }

    @Test
    fun `POST vitals stores createdByName when provided`() {
        val token = doctorToken()
        val body = validCreateBody() + mapOf("createdByName" to "Dr. Sarah Levi")
        val res = rest.exchange(
            "/api/vitals",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
        assertThat(res.body!!["createdByName"]).isEqualTo("Dr. Sarah Levi")
    }

    @Test
    fun `POST vitals defaults createdByName to empty string when not provided`() {
        val token = doctorToken()
        val res = rest.exchange(
            "/api/vitals",
            HttpMethod.POST,
            HttpEntity(validCreateBody(), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
        assertThat(res.body!!["createdByName"]).isEqualTo("")
    }
}
