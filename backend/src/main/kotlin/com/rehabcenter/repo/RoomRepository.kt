package com.rehabcenter.repo

import com.rehabcenter.domain.Room
import org.springframework.data.jpa.repository.JpaRepository

interface RoomRepository : JpaRepository<Room, String> {
    fun findByHouseIdOrderByBuildingAscNumberAsc(houseId: String): List<Room>
    fun findAllByOrderByBuildingAscNumberAsc(): List<Room>
}
