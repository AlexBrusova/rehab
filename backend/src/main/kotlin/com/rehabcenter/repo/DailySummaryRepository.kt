package com.rehabcenter.repo

import com.rehabcenter.domain.DailySummary
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface DailySummaryRepository : JpaRepository<DailySummary, String> {
    @Query(
        """
        select s from DailySummary s
        where s.houseId = :houseId
        and (:date is null or s.date = :date)
        order by s.date desc, s.createdAt desc
        """,
    )
    fun search(
        @Param("houseId") houseId: String,
        @Param("date") date: String?,
    ): List<DailySummary>
}
