package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import com.rehabcenter.testsupport.bearerHeaders
import com.rehabcenter.testsupport.obtainToken
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod

class UsersIT : AbstractIntegrationTest() {
    @Test
    fun `users list contains seeded accounts`() {
        val token = rest.obtainToken("org_manager1", "1234")
        val res =
            rest.exchange(
                "/api/users",
                HttpMethod.GET,
                HttpEntity<Void>(bearerHeaders(token)),
                String::class.java,
            )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body).contains("manager1", "doctor1", "therapist1")
    }

    @Test
    fun `POST users creates new user with required fields`() {
        val token = rest.obtainToken("org_manager1", "1234")
        val body = mapOf(
            "name" to "Test User",
            "username" to "testuser_it",
            "role" to "counselor",
            "roleLabel" to "Counselor",
            "initials" to "TU",
            "color" to "#123456",
            "password" to "securepass",
        )
        val res = rest.exchange(
            "/api/users",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
        assertThat(res.body!!["username"]).isEqualTo("testuser_it")
        assertThat(res.body!!["role"]).isEqualTo("counselor")
    }

    @Test
    fun `POST users ignores unknown extra fields and returns 201`() {
        val token = rest.obtainToken("org_manager1", "1234")
        val body = mapOf(
            "name" to "Test User Extra",
            "username" to "testuser_extra_it",
            "role" to "counselor",
            "roleLabel" to "Counselor",
            // extra unknown fields:
            "id" to "some-id",
            "createdAt" to "2024-01-01T00:00:00Z",
            "updatedAt" to "2024-01-01T00:00:00Z",
            "extraField" to "extra",
            "passwordHash" to "should-be-ignored",
        )
        val res = rest.exchange(
            "/api/users",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            object : ParameterizedTypeReference<Map<String, Any?>>() {},
        )
        assertThat(res.statusCode.value()).isEqualTo(201)
        assertThat(res.body!!["username"]).isEqualTo("testuser_extra_it")
    }

    @Test
    fun `POST users returns 400 when required field is missing`() {
        val token = rest.obtainToken("org_manager1", "1234")
        val body = mapOf(
            "name" to "Test User",
            "username" to "testuser_missing_it",
            // missing role and roleLabel
        )
        val res = rest.exchange(
            "/api/users",
            HttpMethod.POST,
            HttpEntity(body, bearerHeaders(token)),
            String::class.java,
        )
        assertThat(res.statusCode.value()).isEqualTo(400)
    }

    @Test
    fun `PATCH users ignores unknown extra fields - does not return 400`() {
        val token = rest.obtainToken("org_manager1", "1234")
        val patchBody = mapOf(
            "name" to "Dana Katz Updated",
            "color" to "#abcdef",
            // extra unknown fields that must NOT cause 400:
            "id" to "u2",
            "createdAt" to "2024-01-01T00:00:00Z",
            "passwordHash" to "should-be-ignored",
            "extraField" to "extra",
        )
        val res = rest.exchange(
            "/api/users/u2",
            HttpMethod.PATCH,
            HttpEntity(patchBody, bearerHeaders(token)),
            String::class.java,
        )
        // Verify unknown fields do NOT cause 400 Bad Request (that's the regression we're guarding)
        assertThat(res.statusCode.value()).isNotEqualTo(400)
    }
}
