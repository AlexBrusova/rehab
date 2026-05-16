package com.rehabcenter.it

import com.rehabcenter.testsupport.AbstractIntegrationTest
import com.rehabcenter.testsupport.bearerHeaders
import com.rehabcenter.testsupport.obtainToken
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType

/**
 * Extended integration tests for GET /api/field-rules endpoint.
 * Covers scenarios not already tested in FieldRulesIT:
 * - Wrong HTTP methods (POST, PUT, DELETE → 405)
 * - Content-Type header on response
 * - Additional entity field spot-checks
 * - Authenticated access (still works with valid JWT)
 * - Response is consistent (idempotent on repeated calls)
 */
class FieldRulesExtIT : AbstractIntegrationTest() {

    @Suppress("UNCHECKED_CAST")
    private fun fetchRules(): Map<String, Map<String, Map<String, Any?>>> {
        val res = rest.exchange("/api/field-rules", HttpMethod.GET, null, Map::class.java)
        assertThat(res.statusCode).isEqualTo(HttpStatus.OK)
        return res.body as Map<String, Map<String, Map<String, Any?>>>
    }

    // ──────────────────────────────────────────────
    // Wrong HTTP methods
    // ──────────────────────────────────────────────

    @Test
    fun `POST to field-rules returns 405 Method Not Allowed`() {
        val res = rest.exchange("/api/field-rules", HttpMethod.POST, HttpEntity.EMPTY, String::class.java)
        assertThat(res.statusCode).isEqualTo(HttpStatus.METHOD_NOT_ALLOWED)
    }

    @Test
    fun `PUT to field-rules returns 405 Method Not Allowed`() {
        val res = rest.exchange("/api/field-rules", HttpMethod.PUT, HttpEntity.EMPTY, String::class.java)
        assertThat(res.statusCode).isEqualTo(HttpStatus.METHOD_NOT_ALLOWED)
    }

    @Test
    fun `DELETE to field-rules returns 405 Method Not Allowed`() {
        val res = rest.exchange("/api/field-rules", HttpMethod.DELETE, HttpEntity.EMPTY, String::class.java)
        assertThat(res.statusCode).isEqualTo(HttpStatus.METHOD_NOT_ALLOWED)
    }

    // ──────────────────────────────────────────────
    // Content-Type
    // ──────────────────────────────────────────────

    @Test
    fun `field-rules response Content-Type is application-json`() {
        val res = rest.exchange("/api/field-rules", HttpMethod.GET, null, String::class.java)
        assertThat(res.headers.contentType?.isCompatibleWith(MediaType.APPLICATION_JSON)).isTrue()
    }

    // ──────────────────────────────────────────────
    // Access with a valid JWT still works (authenticated path)
    // ──────────────────────────────────────────────

    @Test
    fun `field-rules returns 200 when called with valid Bearer token`() {
        val token = rest.obtainToken("manager1", "1234")
        val headers = bearerHeaders(token)
        val res = rest.exchange("/api/field-rules", HttpMethod.GET, HttpEntity<Void>(headers), String::class.java)
        assertThat(res.statusCode).isEqualTo(HttpStatus.OK)
    }

    // ──────────────────────────────────────────────
    // Response is idempotent
    // ──────────────────────────────────────────────

    @Test
    fun `field-rules returns same result on repeated calls`() {
        val first = fetchRules()
        val second = fetchRules()
        assertThat(first.keys).containsExactlyInAnyOrderElementsOf(second.keys)
    }

    // ──────────────────────────────────────────────
    // Spot-checks: additional entity fields
    // ──────────────────────────────────────────────

    @Test
    fun `login username field has required=true`() {
        val rules = fetchRules()
        val usernameField = rules["login"]!!["username"]!!
        assertThat(usernameField["required"]).isEqualTo(true)
    }

    @Test
    fun `login password field has required=true and maxLength`() {
        val rules = fetchRules()
        val passwordField = rules["login"]!!["password"]!!
        assertThat(passwordField["required"]).isEqualTo(true)
        assertThat(passwordField["maxLength"]).isNotNull()
    }

    @Test
    fun `user role field has required=true and pattern`() {
        val rules = fetchRules()
        val roleField = rules["user"]!!["role"]!!
        assertThat(roleField["required"]).isEqualTo(true)
        assertThat(roleField["pattern"] as String?).isNotBlank()
    }

    @Test
    fun `house name field has required=true`() {
        val rules = fetchRules()
        val nameField = rules["house"]!!["name"]!!
        assertThat(nameField["required"]).isEqualTo(true)
    }

    @Test
    fun `absence status field has pattern`() {
        val rules = fetchRules()
        val statusField = rules["absence"]!!["status"]!!
        assertThat(statusField["pattern"] as String?).isNotBlank()
    }

    @Test
    fun `consequence type field has required=true and maxLength`() {
        val rules = fetchRules()
        val typeField = rules["consequence"]!!["type"]!!
        assertThat(typeField["required"]).isEqualTo(true)
        assertThat(typeField["maxLength"]).isNotNull()
    }

    @Test
    fun `finance type field has required=true and pattern`() {
        val rules = fetchRules()
        val typeField = rules["finance"]!!["type"]!!
        assertThat(typeField["required"]).isEqualTo(true)
        assertThat(typeField["pattern"] as String?).isNotBlank()
    }

    @Test
    fun `cashboxEntry amount field has required=true with min and max bounds`() {
        val rules = fetchRules()
        val amountField = rules["cashboxEntry"]!!["amount"]!!
        assertThat(amountField["required"]).isEqualTo(true)
        assertThat(amountField["min"]).isNotNull()
        assertThat(amountField["max"]).isNotNull()
    }

    @Test
    fun `therapySession urgency field has pattern`() {
        val rules = fetchRules()
        val urgencyField = rules["therapySession"]!!["urgency"]!!
        assertThat(urgencyField["pattern"] as String?).isNotBlank()
    }

    @Test
    fun `shiftDistribution shiftId field has required=true`() {
        val rules = fetchRules()
        val shiftIdField = rules["shiftDistribution"]!!["shiftId"]!!
        assertThat(shiftIdField["required"]).isEqualTo(true)
    }

    @Test
    fun `phone givenAt field has required=true and pattern`() {
        val rules = fetchRules()
        val givenAtField = rules["phone"]!!["givenAt"]!!
        assertThat(givenAtField["required"]).isEqualTo(true)
        assertThat(givenAtField["pattern"] as String?).isNotBlank()
    }

    @Test
    fun `medDistribution time field has required=true and pattern`() {
        val rules = fetchRules()
        val timeField = rules["medDistribution"]!!["time"]!!
        assertThat(timeField["required"]).isEqualTo(true)
        assertThat(timeField["pattern"] as String?).isNotBlank()
    }

    @Test
    fun `schedule date field has required=true`() {
        val rules = fetchRules()
        val dateField = rules["schedule"]!!["date"]!!
        assertThat(dateField["required"]).isEqualTo(true)
    }

    @Test
    fun `patient mood field has min=0 and max=10`() {
        val rules = fetchRules()
        val moodField = rules["patient"]!!["mood"]!!
        assertThat(moodField["min"]).isEqualTo(0)
        assertThat(moodField["max"]).isEqualTo(10)
    }

    @Test
    fun `group date field has required=true`() {
        val rules = fetchRules()
        val dateField = rules["group"]!!["date"]!!
        assertThat(dateField["required"]).isEqualTo(true)
    }
}
