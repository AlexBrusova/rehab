package com.rehabcenter.repo

import com.rehabcenter.domain.Vital
import org.springframework.data.jpa.repository.JpaRepository

interface VitalRepository : JpaRepository<Vital, String> {
    fun findByHouseIdOrderByDateDescCreatedAtDesc(houseId: String): List<Vital>

    fun findByPatientIdOrderByDateDescCreatedAtDesc(patientId: String): List<Vital>
}
