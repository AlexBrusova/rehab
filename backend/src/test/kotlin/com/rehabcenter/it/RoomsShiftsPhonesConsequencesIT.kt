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
}
