package com.rehabcenter.repo

import com.rehabcenter.domain.Med
import org.springframework.data.jpa.repository.JpaRepository

interface MedRepository : JpaRepository<Med, String> {
    fun findByPatientIdOrderByCreatedAtAsc(patientId: String): List<Med>
}
