package com.rehabcenter.testsupport

import org.junit.jupiter.api.BeforeEach
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.web.client.TestRestTemplate

@IntegrationTest
abstract class AbstractIntegrationTest {

    @Autowired
    lateinit var rest: TestRestTemplate

    @Autowired
    lateinit var fixture: IntegrationTestFixture

    @BeforeEach
    fun resetDb() {
        fixture.resetAndSeed()
    }
}
