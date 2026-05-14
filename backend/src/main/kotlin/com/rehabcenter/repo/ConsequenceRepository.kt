package com.rehabcenter.repo

import com.rehabcenter.domain.Consequence
import org.springframework.data.jpa.repository.JpaRepository

interface ConsequenceRepository : JpaRepository<Consequence, String> {
    fun findByHouseIdOrderByCreatedAtDesc(houseId: String): List<Consequence>
    fun findAllByOrderByCreatedAtDesc(): List<Consequence>
}
