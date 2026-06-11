package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import com.rehabcenter.testsupport.bearerHeaders
import com.rehabcenter.testsupport.obtainToken
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod

class PatientsIT : AbstractIntegrationTest() {
    @Test
    fun `list patients for house h1`() {
        val token = rest.obtainToken("manager1", "1234")
        val res =
            rest.exchange(
                "/api/patients?houseId=h1",
                HttpMethod.GET,
                HttpEntity<Void>(bearerHeaders(token)),
                object : ParameterizedTypeReference<List<Map<String, Any?>>>() {},
            )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body!!.size).isGreaterThanOrEqualTo(2)
        assertThat(res.body!!.any { it["id"] == "p1" }).isTrue()
    }

    @Test
    fun `patch patient mood`() {
        val token = rest.obtainToken("manager1", "1234")
        val headers = bearerHeaders(token)
        val patch =
            HttpEntity(
                mapOf("mood" to 9),
                headers,
            )
        val res =
            rest.exchange(
                "/api/patients/p1",
                HttpMethod.PATCH,
                patch,
                object : ParameterizedTypeReference<Map<String, Any?>>() {},
            )
        assertThat(res.statusCode.value()).isEqualTo(200)
        assertThat(res.body!!["mood"]).isEqualTo(9)
    }

    @Test
    fun `patch awayType maps to status away in json`() {
        val token = rest.obtainToken("manager1", "1234")
        val headers = bearerHeaders(token)
        val res =
            rest.exchange(
                "/api/patients/p1",
                HttpMethod.PATCH,
                HttpEntity(mapOf("awayType" to "hospital"), headers),
                object : ParameterizedTypeReference<Map<String, Any?>>() {},
            )
        assertThat(res.statusCode.value()).isEqualTo(200)
        assertThat(res.body!!["awayType"]).isEqualTo("hospital")
        assertThat(res.body!!["status"]).isEqualTo("away")

        val cleared =
            rest.exchange(
                "/api/patients/p1",
                HttpMethod.PATCH,
                HttpEntity(mapOf("awayType" to null), headers),
                object : ParameterizedTypeReference<Map<String, Any?>>() {},
            )
        assertThat(cleared.statusCode.value()).isEqualTo(200)
        assertThat(cleared.body!!["awayType"]).isNull()
        assertThat(cleared.body!!["status"]).isEqualTo("active")
    }

    @Test
    fun `patch patient notes`() {
        val token = rest.obtainToken("manager1", "1234")
        val headers = bearerHeaders(token)
        val res =
            rest.exchange(
                "/api/patients/p1",
                HttpMethod.PATCH,
                HttpEntity(mapOf("notes" to "Needs follow-up next week"), headers),
                object : ParameterizedTypeReference<Map<String, Any?>>() {},
            )
        assertThat(res.statusCode.value()).isEqualTo(200)
        assertThat(res.body!!["notes"]).isEqualTo("Needs follow-up next week")
    }

    @Test
    fun `patch patient notes too long is rejected`() {
        val token = rest.obtainToken("manager1", "1234")
        val headers = bearerHeaders(token)
        val tooLong = "x".repeat(4001)
        val res =
            rest.exchange(
                "/api/patients/p1",
                HttpMethod.PATCH,
                HttpEntity(mapOf("notes" to tooLong), headers),
                object : ParameterizedTypeReference<Map<String, Any?>>() {},
            )
        assertThat(res.statusCode.value()).isEqualTo(400)
    }

    @Test
    fun `create patient returns 201 and persists`() {
        val token = rest.obtainToken("manager1", "1234")
        val headers = bearerHeaders(token)
        val body =
            mapOf(
                "name" to "IT New Patient",
                "dob" to "01/01/1991",
                "admitDate" to "01/01/2025",
                "houseId" to "h1",
            )
        val create =
            rest.exchange(
                "/api/patients",
                HttpMethod.POST,
                HttpEntity(body, headers),
                object : ParameterizedTypeReference<Map<String, Any?>>() {},
            )
        assertThat(create.statusCode.value()).isEqualTo(201)
        val id = create.body!!["id"] as String
        assertThat(id).isNotBlank()

        val listed =
            rest.exchange(
                "/api/patients?houseId=h1",
                HttpMethod.GET,
                HttpEntity<Void>(headers),
                object : ParameterizedTypeReference<List<Map<String, Any?>>>() {},
            )
        assertThat(listed.body!!.any { it["id"] == id && it["name"] == "IT New Patient" }).isTrue()
    }

    @Test
    fun `create patient with notes persists notes`() {
        val token = rest.obtainToken("manager1", "1234")
        val headers = bearerHeaders(token)
        val body =
            mapOf(
                "name" to "IT Notes Patient",
                "dob" to "01/01/1991",
                "admitDate" to "01/01/2025",
                "houseId" to "h1",
                "notes" to "Allergic to penicillin",
            )
        val create =
            rest.exchange(
                "/api/patients",
                HttpMethod.POST,
                HttpEntity(body, headers),
                object : ParameterizedTypeReference<Map<String, Any?>>() {},
            )
        assertThat(create.statusCode.value()).isEqualTo(201)
        assertThat(create.body!!["notes"]).isEqualTo("Allergic to penicillin")
    }

    @Test
    fun `GET patients returns 200 and status field is string active or archived`() {
        val token = rest.obtainToken("manager1", "1234")
        val res =
            rest.exchange(
                "/api/patients?houseId=h1",
                HttpMethod.GET,
                HttpEntity<Void>(bearerHeaders(token)),
                object : ParameterizedTypeReference<List<Map<String, Any?>>>() {},
            )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body!!).isNotEmpty()
        res.body!!.forEach { patient ->
            val status = patient["status"] as? String
            assertThat(status).isNotNull()
            assertThat(status).isIn("active", "archived", "away")
        }
    }

    @Test
    fun `POST patient returns 201 and status is active`() {
        val token = rest.obtainToken("manager1", "1234")
        val headers = bearerHeaders(token)
        val body =
            mapOf(
                "name" to "IT Status Test Patient",
                "dob" to "01/01/1992",
                "admitDate" to "01/01/2025",
                "houseId" to "h1",
            )
        val res =
            rest.exchange(
                "/api/patients",
                HttpMethod.POST,
                HttpEntity(body, headers),
                object : ParameterizedTypeReference<Map<String, Any?>>() {},
            )
        assertThat(res.statusCode.value()).isEqualTo(201)
        assertThat(res.body!!["status"]).isEqualTo("active")
    }

    @Test
    fun `list archived patients`() {
        val token = rest.obtainToken("manager1", "1234")
        val res =
            rest.exchange(
                "/api/patients/archived?houseId=h1",
                HttpMethod.GET,
                HttpEntity<Void>(bearerHeaders(token)),
                object : ParameterizedTypeReference<List<Map<String, Any?>>>() {},
            )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body!!).isEmpty()
    }
}
