package com.rehabcenter.it

import com.rehabcenter.repo.PatientRepository
import com.rehabcenter.testsupport.AbstractIntegrationTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired

class OptimisticLockIT : AbstractIntegrationTest() {

    @Autowired
    lateinit var patients: PatientRepository

    @Test
    fun `patient entity has version field`() {
        val patient = patients.findAll().first()
        // @Version field should start at 0 for existing seeded records
        assertThat(patient.version).isGreaterThanOrEqualTo(0L)
    }
}
