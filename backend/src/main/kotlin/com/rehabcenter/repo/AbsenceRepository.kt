package com.rehabcenter.repo

import com.rehabcenter.domain.Absence
import org.springframework.data.jpa.repository.JpaRepository

interface AbsenceRepository : JpaRepository<Absence, String> {
    fun findByHouseIdOrderByCreatedAtDesc(houseId: String): List<Absence>
}
