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
}
