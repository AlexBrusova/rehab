package com.rehabcenter.repo

import com.rehabcenter.domain.MedDistribution
import org.springframework.data.jpa.repository.JpaRepository

interface MedDistributionRepository : JpaRepository<MedDistribution, String> {
    fun findByPatientIdAndDateOrderByTimeAsc(patientId: String, date: String): List<MedDistribution>
}
