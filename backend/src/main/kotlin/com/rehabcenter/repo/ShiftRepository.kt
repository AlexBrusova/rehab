package com.rehabcenter.repo

import com.rehabcenter.domain.Shift
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface ShiftRepository : JpaRepository<Shift, String> {
    @EntityGraph(attributePaths = ["counselor", "counselor.allowedHouses"])
    @Query("select s from Shift s where s.id = :id")
    fun fetchWithCounselorById(id: String): Shift?

    @EntityGraph(attributePaths = ["counselor", "counselor.allowedHouses"])
    @Query(
        """
        select s from Shift s
        where (:houseId is null or s.houseId = :houseId)
        and (:date is null or s.date = :date)
        order by s.createdAt desc
        """,
    )
    fun search(
        @Param("houseId") houseId: String?,
        @Param("date") date: String?,
    ): List<Shift>
}
