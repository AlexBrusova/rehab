package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import com.rehabcenter.testsupport.bearerHeaders
import com.rehabcenter.testsupport.obtainToken
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod

class PatientValidationIT : AbstractIntegrationTest() {

    private fun managerToken() = rest.obtainToken("manager1", "1234")

    @Test
    fun `POST patients with missing name returns 400 with fields dot name`() {
        val token = managerToken()
        val body = mapOf(
            "dob" to "01/01/1990",
            "admitDate" to "01/01/2025",
            "houseId" to "h1",
        )
        val res = rest.exchange(
            "/api/patients",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
        @Suppress("UNCHECKED_CAST")
        val fields = res.body!!["fields"] as Map<String, Any?>?
        assertThat(fields).isNotNull
        assertThat(fields!!).containsKey("name")
    }

    @Test
    fun `POST patients with missing dob returns 400 with fields dot dob`() {
        val token = managerToken()
        val body = mapOf(
            "name" to "Test Patient",
            "admitDate" to "01/01/2025",
            "houseId" to "h1",
        )
        val res = rest.exchange(
            "/api/patients",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
        @Suppress("UNCHECKED_CAST")
        val fields = res.body!!["fields"] as Map<String, Any?>?
        assertThat(fields).isNotNull
        assertThat(fields!!).containsKey("dob")
    }

    @Test
    fun `POST patients with non-existent houseId returns 400 with error message`() {
        val token = managerToken()
        val body = mapOf(
            "name" to "Test Patient",
            "dob" to "01/01/1990",
            "admitDate" to "01/01/2025",
            "houseId" to "non-existent-house-id",
        )
        val res = rest.exchange(
            "/api/patients",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
        assertThat(res.body!!["error"].toString()).contains("House not found")
    }

    @Test
    fun `POST patients with roomId from different house returns 400`() {
        val token = managerToken()
        // r5 belongs to h2, not h1
        val body = mapOf(
            "name" to "Test Patient",
            "dob" to "01/01/1990",
            "admitDate" to "01/01/2025",
            "houseId" to "h1",
            "roomId" to "r5",
        )
        val res = rest.exchange(
            "/api/patients",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
        assertThat(res.body!!["error"].toString()).contains("Room does not belong to the specified house")
    }

    @Test
    fun `POST patients with all valid fields returns 201 and persisted patient`() {
        val token = managerToken()
        val body = mapOf(
            "name" to "Valid Patient",
            "dob" to "15/06/1985",
            "admitDate" to "01/01/2025",
            "houseId" to "h1",
        )
        val res = rest.exchange(
            "/api/patients",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
        assertThat(res.body!!["id"]).isNotNull()
        assertThat(res.body!!["name"]).isEqualTo("Valid Patient")
    }

    @Test
    fun `PATCH patients with invalid status returns 400`() {
        val token = managerToken()
        val patch = mapOf("status" to "invalid_value")
        val res = rest.exchange(
            "/api/patients/p1",
            HttpMethod.PATCH,
            HttpEntity(patch, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
        assertThat(res.body!!["error"].toString()).isNotBlank()
    }

    @Test
    fun `POST patients with extra fields idNum addiction notes returns 201`() {
        val token = managerToken()
        val body = mapOf(
            "name" to "Extra Fields Patient",
            "dob" to "10/05/1990",
            "admitDate" to "01/03/2025",
            "houseId" to "h1",
            "idNum" to "ID-12345",
            "addiction" to "alcohol",
            "notes" to "some extra note from frontend",
        )
        val res = rest.exchange(
            "/api/patients",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
        assertThat(res.body!!["name"]).isEqualTo("Extra Fields Patient")
    }

    @Test
    fun `POST patients with non-existent roomId returns 400`() {
        val token = managerToken()
        val body = mapOf(
            "name" to "Test Patient",
            "dob" to "01/01/1990",
            "admitDate" to "01/01/2025",
            "houseId" to "h1",
            "roomId" to "non-existent-room-id",
        )
        val res = rest.exchange(
            "/api/patients",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
        assertThat(res.body!!["error"].toString()).contains("Room not found")
    }

    // --- GET /api/patients (no houseId) ---

    @Test
    fun `GET patients without houseId returns all active patients`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/patients",
            HttpMethod.GET,
            HttpEntity<Void>(bearerHeaders(token)),
            object : ParameterizedTypeReference<List<Map<String, Any?>>>() {},
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body!!).isNotEmpty()
    }

    // --- PATCH field validation ---

    @Test
    fun `PATCH patient name too long returns 400`() {
        val token = managerToken()
        val longName = "A".repeat(256)
        val res = rest.exchange(
            "/api/patients/p1",
            HttpMethod.PATCH,
            HttpEntity(mapOf("name" to longName), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
        assertThat(res.body!!["error"].toString()).contains("Name must be at most")
    }

    @Test
    fun `PATCH patient name updates successfully`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/patients/p1",
            HttpMethod.PATCH,
            HttpEntity(mapOf("name" to "Updated Name"), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(200)
        assertThat(res.body!!["name"]).isEqualTo("Updated Name")
    }

    @Test
    fun `PATCH patient dob too long returns 400`() {
        val token = managerToken()
        val longDob = "1".repeat(33)
        val res = rest.exchange(
            "/api/patients/p1",
            HttpMethod.PATCH,
            HttpEntity(mapOf("dob" to longDob), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
        assertThat(res.body!!["error"].toString()).contains("Date of birth value is too long")
    }

    @Test
    fun `PATCH patient dob updates successfully`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/patients/p1",
            HttpMethod.PATCH,
            HttpEntity(mapOf("dob" to "02/02/1992"), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(200)
        assertThat(res.body!!["dob"]).isEqualTo("02/02/1992")
    }

    @Test
    fun `PATCH patient admitDate too long returns 400`() {
        val token = managerToken()
        val longDate = "1".repeat(33)
        val res = rest.exchange(
            "/api/patients/p1",
            HttpMethod.PATCH,
            HttpEntity(mapOf("admitDate" to longDate), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
        assertThat(res.body!!["error"].toString()).contains("Admit date value is too long")
    }

    @Test
    fun `PATCH patient admitDate updates successfully`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/patients/p1",
            HttpMethod.PATCH,
            HttpEntity(mapOf("admitDate" to "15/03/2025"), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(200)
        assertThat(res.body!!["admitDate"]).isEqualTo("15/03/2025")
    }

    @Test
    fun `PATCH patient roomId too long returns 400`() {
        val token = managerToken()
        val longRoomId = "r".repeat(65)
        val res = rest.exchange(
            "/api/patients/p1",
            HttpMethod.PATCH,
            HttpEntity(mapOf("roomId" to longRoomId), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
        assertThat(res.body!!["error"].toString()).contains("Room ID is too long")
    }

    @Test
    fun `PATCH patient roomId updates successfully`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/patients/p1",
            HttpMethod.PATCH,
            HttpEntity(mapOf("roomId" to "r1"), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(200)
        assertThat(res.body!!["roomId"]).isEqualTo("r1")
    }

    @Test
    fun `PATCH patient mood not a number returns 400`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/patients/p1",
            HttpMethod.PATCH,
            HttpEntity("""{"mood":"bad"}""", bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
        assertThat(res.body!!["error"].toString()).contains("Mood must be a number")
    }

    @Test
    fun `PATCH patient mood out of range returns 400`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/patients/p1",
            HttpMethod.PATCH,
            HttpEntity(mapOf("mood" to 11), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
        assertThat(res.body!!["error"].toString()).contains("Mood must be between 0 and 10")
    }

    @Test
    fun `PATCH patient alert not boolean returns 400`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/patients/p1",
            HttpMethod.PATCH,
            HttpEntity("""{"alert":"yes"}""", bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
        assertThat(res.body!!["error"].toString()).contains("Alert must be a boolean")
    }

    @Test
    fun `PATCH patient alert boolean updates successfully`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/patients/p1",
            HttpMethod.PATCH,
            HttpEntity(mapOf("alert" to true), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(200)
        assertThat(res.body!!["alert"]).isEqualTo(true)
    }

    @Test
    fun `PATCH patient status null is ignored`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/patients/p1",
            HttpMethod.PATCH,
            HttpEntity("""{"status":null}""", bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(200)
    }

    @Test
    fun `PATCH patient status archived updates successfully`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/patients/p1",
            HttpMethod.PATCH,
            HttpEntity(mapOf("status" to "archived"), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(200)
        // status JSON field is computed: archived when patientRecordStatus=archived and awayType is null
        assertThat(res.body!!["status"]).isEqualTo("archived")
    }

    @Test
    fun `PATCH patient dischargeType too long returns 400`() {
        val token = managerToken()
        val longType = "t".repeat(121)
        val res = rest.exchange(
            "/api/patients/p1",
            HttpMethod.PATCH,
            HttpEntity(mapOf("dischargeType" to longType), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
        assertThat(res.body!!["error"].toString()).contains("Discharge type value is too long")
    }

    @Test
    fun `PATCH patient dischargeType updates successfully`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/patients/p1",
            HttpMethod.PATCH,
            HttpEntity(mapOf("dischargeType" to "voluntary"), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(200)
        assertThat(res.body!!["dischargeType"]).isEqualTo("voluntary")
    }

    @Test
    fun `PATCH patient dischargeDate too long returns 400`() {
        val token = managerToken()
        val longDate = "d".repeat(33)
        val res = rest.exchange(
            "/api/patients/p1",
            HttpMethod.PATCH,
            HttpEntity(mapOf("dischargeDate" to longDate), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
        assertThat(res.body!!["error"].toString()).contains("Discharge date value is too long")
    }

    @Test
    fun `PATCH patient dischargeDate updates successfully`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/patients/p1",
            HttpMethod.PATCH,
            HttpEntity(mapOf("dischargeDate" to "30/06/2025"), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(200)
        assertThat(res.body!!["dischargeDate"]).isEqualTo("30/06/2025")
    }

    @Test
    fun `PATCH patient daysInRehab not a number returns 400`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/patients/p1",
            HttpMethod.PATCH,
            HttpEntity("""{"daysInRehab":"many"}""", bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
        assertThat(res.body!!["error"].toString()).contains("Days in rehab must be a number")
    }

    @Test
    fun `PATCH patient daysInRehab out of range returns 400`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/patients/p1",
            HttpMethod.PATCH,
            HttpEntity(mapOf("daysInRehab" to 100001), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
        assertThat(res.body!!["error"].toString()).contains("Days in rehab must be between 0 and 100000")
    }

    @Test
    fun `PATCH patient daysInRehab updates successfully`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/patients/p1",
            HttpMethod.PATCH,
            HttpEntity(mapOf("daysInRehab" to 42), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(200)
        assertThat(res.body!!["daysInRehab"]).isEqualTo(42)
    }

    @Test
    fun `PATCH patient awayType null clears field`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/patients/p1",
            HttpMethod.PATCH,
            HttpEntity("""{"awayType":null}""", bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(200)
        assertThat(res.body!!["awayType"]).isNull()
    }

    @Test
    fun `PATCH patient not found returns 404`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/patients/non-existent-id",
            HttpMethod.PATCH,
            HttpEntity(mapOf("name" to "X"), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(404)
    }

    // --- DELETE /api/patients/{id} ---

    @Test
    fun `DELETE patient archives it and returns ok true`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/patients/p1",
            HttpMethod.DELETE,
            HttpEntity<Void>(bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(200)
        assertThat(res.body!!["ok"]).isEqualTo(true)
    }

    @Test
    fun `DELETE patient not found returns 404`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/patients/non-existent-patient",
            HttpMethod.DELETE,
            HttpEntity<Void>(bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(404)
    }

    @Test
    fun `POST patients without token returns 401`() {
        val body = mapOf(
            "name" to "Test",
            "dob" to "01/01/1990",
            "admitDate" to "01/01/2025",
            "houseId" to "h1",
        )
        val headers = org.springframework.http.HttpHeaders().apply {
            contentType = org.springframework.http.MediaType.APPLICATION_JSON
        }
        val res = rest.exchange(
            "/api/patients",
            HttpMethod.POST,
            HttpEntity(body, headers),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(401)
    }

    @Test
    fun `PATCH patient with valid daysInRehab 0 boundary returns 200`() {
        val token = managerToken()
        val res = rest.exchange(
            "/api/patients/p1",
            HttpMethod.PATCH,
            HttpEntity(mapOf("daysInRehab" to 0), bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(200)
        assertThat(res.body!!["daysInRehab"]).isEqualTo(0)
    }
}
