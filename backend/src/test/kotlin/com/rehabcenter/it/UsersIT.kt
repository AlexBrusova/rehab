package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import com.rehabcenter.testsupport.bearerHeaders
import com.rehabcenter.testsupport.obtainToken
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
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
}
