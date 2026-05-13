package com.rehabcenter.it

import com.rehabcenter.domain.House
import com.rehabcenter.testsupport.AbstractIntegrationTest
import com.rehabcenter.testsupport.bearerHeaders
import com.rehabcenter.testsupport.obtainToken
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod

class HousesIT : AbstractIntegrationTest() {
    @Test
    fun `houses require auth`() {
        val res = rest.exchange("/api/houses", HttpMethod.GET, null, String::class.java)
        assertThat(res.statusCode.value()).isEqualTo(401)
    }

    @Test
    fun `houses returns seeded houses`() {
        val token = rest.obtainToken("counselor1", "1234")
        val res =
            rest.exchange(
                "/api/houses",
                HttpMethod.GET,
                HttpEntity<Void>(bearerHeaders(token)),
                object : ParameterizedTypeReference<List<House>>() {},
            )
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body).hasSize(3)
        assertThat(res.body!!.map { it.name }).contains("House A", "House B", "House C")
    }
}
