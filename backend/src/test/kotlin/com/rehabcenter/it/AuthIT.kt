package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import com.rehabcenter.web.LoginRequest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType

class AuthIT : AbstractIntegrationTest() {
    @Test
    fun `login rejects bad password`() {
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON
        val body = HttpEntity(LoginRequest("manager1", "wrong"), headers)
        val res = rest.exchange("/api/auth/login", HttpMethod.POST, body, String::class.java)
        assertThat(res.statusCode.value()).isEqualTo(401)
    }

    @Test
    fun `login accepts legacy demo credentials manager1 1234`() {
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON
        val body = HttpEntity(LoginRequest("manager1", "1234"), headers)
        val res = rest.exchange("/api/auth/login", HttpMethod.POST, body, String::class.java)
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body).contains("token")
        assertThat(res.body).contains("manager1")
    }

    @Test
    fun `login org_manager1`() {
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON
        val body = HttpEntity(LoginRequest("org_manager1", "1234"), headers)
        val res = rest.exchange("/api/auth/login", HttpMethod.POST, body, String::class.java)
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
    }
}
