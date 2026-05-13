package com.rehabcenter.repo

import com.rehabcenter.domain.Phone
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface PhoneRepository : JpaRepository<Phone, String> {
    @EntityGraph(attributePaths = ["patient"])
    @Query(
        "select p from Phone p where p.patient.houseId = :houseId order by p.createdAt desc",
    )
    fun findByPatientHouseId(houseId: String): List<Phone>

    @EntityGraph(attributePaths = ["patient"])
    @Query("select p from Phone p order by p.createdAt desc")
    fun findAllForPhones(): List<Phone>
}
