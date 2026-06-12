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
    fun `patch updates idNum, addiction, phone and emergency contact fields`() {
        val token = rest.obtainToken("manager1", "1234")
        val headers = bearerHeaders(token)
        val res =
            rest.exchange(
                "/api/patients/p1",
                HttpMethod.PATCH,
                HttpEntity(
                    mapOf(
                        "idNum" to "987654321",
                        "addiction" to "Gambling",
                        "phone" to "+1-555-0100",
                        "emergencyContactName" to "Jane Doe",
                        "emergencyContactPhone" to "+1-555-0199",
                    ),
                    headers,
                ),
                object : ParameterizedTypeReference<Map<String, Any?>>() {},
            )
        assertThat(res.statusCode.value()).isEqualTo(200)
        assertThat(res.body!!["idNum"]).isEqualTo("987654321")
        assertThat(res.body!!["addiction"]).isEqualTo("Gambling")
        assertThat(res.body!!["phone"]).isEqualTo("+1-555-0100")
        assertThat(res.body!!["emergencyContactName"]).isEqualTo("Jane Doe")
        assertThat(res.body!!["emergencyContactPhone"]).isEqualTo("+1-555-0199")
    }

    @Test
    fun `patch rejects emergencyContactName longer than SHORT_LABEL`() {
        val token = rest.obtainToken("manager1", "1234")
        val headers = bearerHeaders(token)
        val tooLong = "a".repeat(121)
        val res =
            rest.exchange(
                "/api/patients/p1",
                HttpMethod.PATCH,
                HttpEntity(mapOf("emergencyContactName" to tooLong), headers),
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
    fun `create patient persists idNum and addiction`() {
        val token = rest.obtainToken("manager1", "1234")
        val headers = bearerHeaders(token)
        val body =
            mapOf(
                "name" to "IT Patient With Details",
                "dob" to "01/01/1991",
                "admitDate" to "01/01/2025",
                "houseId" to "h1",
                "idNum" to "123456789",
                "addiction" to "Alcohol",
            )
        val create =
            rest.exchange(
                "/api/patients",
                HttpMethod.POST,
                HttpEntity(body, headers),
                object : ParameterizedTypeReference<Map<String, Any?>>() {},
            )
        assertThat(create.statusCode.value()).isEqualTo(201)
        assertThat(create.body!!["idNum"]).isEqualTo("123456789")
        assertThat(create.body!!["addiction"]).isEqualTo("Alcohol")
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
