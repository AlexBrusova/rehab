package com.rehabcenter.testsupport

import com.rehabcenter.web.LoginRequest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType

fun TestRestTemplate.obtainToken(username: String, password: String): String {
    val headers = HttpHeaders()
    headers.contentType = MediaType.APPLICATION_JSON
    val entity = HttpEntity(LoginRequest(username, password), headers)
    val response =
        exchange(
            "/api/auth/login",
            HttpMethod.POST,
            entity,
            object : ParameterizedTypeReference<Map<String, Any>>() {},
        )

    @Suppress("UNCHECKED_CAST")
    val body = response.body as Map<String, Any>
    return body["token"] as String
}

fun bearerHeaders(token: String): HttpHeaders =
    HttpHeaders().apply {
        contentType = MediaType.APPLICATION_JSON
        setBearerAuth(token)
    }
