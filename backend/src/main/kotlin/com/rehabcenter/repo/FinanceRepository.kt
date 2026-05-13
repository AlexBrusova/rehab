package com.rehabcenter.repo

import com.rehabcenter.domain.Finance
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface FinanceRepository : JpaRepository<Finance, String> {
    fun findByPatientIdOrderByDateDescCreatedAtDesc(patientId: String): List<Finance>

    @Query(
        """
        select f from Finance f
        join Patient p on f.patientId = p.id
        where p.houseId = :houseId
        order by f.createdAt desc
        """,
    )
    fun findByHouseIdOrderByCreatedAtDesc(@Param("houseId") houseId: String): List<Finance>
}
