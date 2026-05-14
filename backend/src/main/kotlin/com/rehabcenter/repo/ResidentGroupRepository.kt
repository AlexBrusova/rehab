package com.rehabcenter.repo

import com.rehabcenter.domain.ResidentGroup
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface ResidentGroupRepository : JpaRepository<ResidentGroup, String> {
    @EntityGraph(attributePaths = ["attendance"])
    @Query(
        """
        select g from ResidentGroup g
        where g.houseId = :houseId
        and (:date is null or g.date = :date)
        order by g.date desc, g.createdAt desc
        """,
    )
    fun search(
        @Param("houseId") houseId: String,
        @Param("date") date: String?,
    ): List<ResidentGroup>
}
