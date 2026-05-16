package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus

class FieldRulesIT : AbstractIntegrationTest() {

    @Suppress("UNCHECKED_CAST")
    private fun fetchRules(): Map<String, Map<String, Map<String, Any?>>> {
        val res = rest.exchange(
            "/api/field-rules",
            HttpMethod.GET,
            null,
            Map::class.java,
        )
        assertThat(res.statusCode).isEqualTo(HttpStatus.OK)
        return res.body as Map<String, Map<String, Map<String, Any?>>>
    }

    @Test
    fun `field-rules returns 200 without auth`() {
        val res = rest.exchange("/api/field-rules", HttpMethod.GET, null, String::class.java)
        assertThat(res.statusCode.value()).isEqualTo(200)
    }

    @Test
    fun `field-rules response contains expected entities`() {
        val rules = fetchRules()
        val expectedKeys = listOf(
            "login", "user", "patient", "room", "house", "med",
            "absence", "consequence", "shift", "schedule", "group",
            "phone", "medDistribution", "cashboxEntry", "cashboxCount",
            "finance", "therapySession", "shiftDistribution",
        )
        assertThat(rules.keys).containsAll(expectedKeys)
    }

    @Test
    fun `patient name field has required=true and correct maxLength`() {
        val rules = fetchRules()
        val nameField = rules["patient"]!!["name"]!!
        assertThat(nameField["required"]).isEqualTo(true)
        assertThat(nameField["maxLength"]).isEqualTo(255)
    }

    @Test
    fun `room capacity field has min and max`() {
        val rules = fetchRules()
        val capacityField = rules["room"]!!["capacity"]!!
        assertThat(capacityField["min"]).isEqualTo(1)
        assertThat(capacityField["max"]).isEqualTo(50)
    }

    @Test
    fun `med times field has allowedValues`() {
        val rules = fetchRules()
        val timesField = rules["med"]!!["times"]!!

        @Suppress("UNCHECKED_CAST")
        val allowedValues = timesField["allowedValues"] as List<String>
        assertThat(allowedValues).containsExactlyInAnyOrder("morning", "noon", "evening", "night")
    }

    @Test
    fun `shift status field has pattern`() {
        val rules = fetchRules()
        val statusField = rules["shift"]!!["status"]!!
        val pattern = statusField["pattern"] as String?
        assertThat(pattern).isNotBlank()
    }
}
