package com.rehabcenter.repo

import com.rehabcenter.domain.House
import org.springframework.data.jpa.repository.JpaRepository

interface HouseRepository : JpaRepository<House, String> {
    fun findAllByOrderByNameAsc(): List<House>
}
