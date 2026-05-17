package com.rehabcenter.it

import com.rehabcenter.domain.Consequence
import com.rehabcenter.domain.Phone
import com.rehabcenter.domain.Room
import com.rehabcenter.testsupport.AbstractIntegrationTest
import com.rehabcenter.testsupport.bearerHeaders
import com.rehabcenter.testsupport.obtainToken
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod

class RoomsShiftsPhonesConsequencesIT : AbstractIntegrationTest() {
    @Test
    fun rooms() {
        val token = rest.obtainToken("manager1", "1234")
        val res =
            rest.exchange(
                "/api/rooms?houseId=h1",
                HttpMethod.GET,
                HttpEntity<Void>(bearerHeaders(token)),
                object : ParameterizedTypeReference<List<Room>>() {},
            )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body!!.size).isGreaterThanOrEqualTo(3)
    }

    @Test
    fun shifts() {
        val token = rest.obtainToken("manager1", "1234")
        val res =
            rest.exchange(
                "/api/shifts?houseId=h1",
                HttpMethod.GET,
                HttpEntity<Void>(bearerHeaders(token)),
                String::class.java,
            )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body).contains("s-demo-1")
    }

    @Test
    fun phones() {
        val token = rest.obtainToken("manager1", "1234")
        val res =
            rest.exchange(
                "/api/phones?houseId=h1",
                HttpMethod.GET,
                HttpEntity<Void>(bearerHeaders(token)),
                object : ParameterizedTypeReference<List<Phone>>() {},
            )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body!!.any { it.id == "ph-demo-1" }).isTrue()
    }

    @Test
    fun consequences() {
        val token = rest.obtainToken("manager1", "1234")
        val res =
            rest.exchange(
                "/api/consequences?houseId=h1",
                HttpMethod.GET,
                HttpEntity<Void>(bearerHeaders(token)),
                object : ParameterizedTypeReference<List<Consequence>>() {},
            )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body!!.any { it.id == "c-demo-1" }).isTrue()
    }

    @Test
    fun `POST rooms ignores unknown extra fields and returns 201`() {
        val token = rest.obtainToken("manager1", "1234")
        val body = mapOf(
            "number" to "Room 99",
            "building" to "Building Z",
            "capacity" to 3,
            "houseId" to "h1",
            // extra unknown fields:
            "id" to "some-id",
            "createdAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/rooms",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
        assertThat(res.body!!["number"]).isEqualTo("Room 99")
    }

    @Test
    fun `PATCH rooms ignores unknown extra fields and returns 200`() {
        val token = rest.obtainToken("manager1", "1234")
        val patchBody = mapOf(
            "number" to "Room 1 Updated",
            "capacity" to 3,
            // extra unknown fields:
            "id" to "r1",
            "createdAt" to "2024-01-01T00:00:00Z",
            "houseId" to "h1",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/rooms/r1",
            HttpMethod.PATCH,
            HttpEntity(patchBody, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
    }

    @Test
    fun `POST phones ignores unknown extra fields and returns 201`() {
        val token = rest.obtainToken("counselor1", "1234")
        val body = mapOf(
            "patientId" to "p1",
            "givenAt" to "10:00",
            "returnBy" to "11:00",
            // extra unknown fields:
            "id" to "some-id",
            "createdAt" to "2024-01-01T00:00:00Z",
            "status" to "active",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/phones",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
        assertThat(res.body!!["patientId"]).isEqualTo("p1")
    }

    @Test
    fun `PATCH phones ignores unknown extra fields and returns 200`() {
        val token = rest.obtainToken("counselor1", "1234")
        val patchBody = mapOf(
            "status" to "returned",
            "returnedAt" to "11:05",
            "late" to false,
            // extra unknown fields:
            "id" to "ph-demo-1",
            "createdAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/phones/ph-demo-1",
            HttpMethod.PATCH,
            HttpEntity(patchBody, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
    }

    @Test
    fun `POST shifts ignores unknown extra fields and returns 201`() {
        val token = rest.obtainToken("manager1", "1234")
        val body = mapOf(
            "houseId" to "h1",
            "counselorId" to "u4",
            "date" to "2025-06-01",
            "shift" to "24h",
            "note" to "Test shift",
            "start" to "08:00",
            // extra unknown fields:
            "id" to "some-id",
            "createdAt" to "2024-01-01T00:00:00Z",
            "status" to "pending",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/shifts",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
    }

    @Test
    fun `PATCH shifts ignores unknown extra fields and returns 200`() {
        val token = rest.obtainToken("manager1", "1234")
        val patchBody = mapOf(
            "status" to "completed",
            "end" to "08:00",
            "handedTo" to "u5",
            // extra unknown fields:
            "id" to "s-demo-1",
            "createdAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/shifts/s-demo-1",
            HttpMethod.PATCH,
            HttpEntity(patchBody, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
    }
}
