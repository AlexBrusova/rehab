package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.http.HttpMethod

class ActuatorHealthIT : AbstractIntegrationTest() {
    @Test
    fun `actuator health is public`() {
        val res = rest.exchange("/actuator/health", HttpMethod.GET, null, String::class.java)
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body).contains("UP")
    }

    @Test
    fun `liveness probe`() {
        val res = rest.exchange("/actuator/health/liveness", HttpMethod.GET, null, String::class.java)
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
    }
}
