package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class HealthIT : AbstractIntegrationTest() {
    @Test
    fun `legacy health endpoint`() {
        val res = rest.getForEntity("/health", String::class.java)
        assertThat(res.statusCode.is2xxSuccessful).isTrue()
        assertThat(res.body).contains("ok")
    }
}
