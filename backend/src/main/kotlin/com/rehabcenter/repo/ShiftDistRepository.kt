package com.rehabcenter.repo

import com.rehabcenter.domain.ShiftDist
import com.rehabcenter.domain.ShiftDistId
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface ShiftDistRepository : JpaRepository<ShiftDist, ShiftDistId> {
    @Query(
        """
        select sd from ShiftDist sd
        join Patient p on sd.patientId = p.id
        where p.houseId = :houseId and sd.date = :date
        """,
    )
    fun findByHouseIdAndDate(
        @Param("houseId") houseId: String,
        @Param("date") date: String,
    ): List<ShiftDist>
}
