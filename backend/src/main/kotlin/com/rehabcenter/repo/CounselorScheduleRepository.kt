package com.rehabcenter.repo

import com.rehabcenter.domain.CounselorSchedule
import org.springframework.data.jpa.repository.JpaRepository

interface CounselorScheduleRepository : JpaRepository<CounselorSchedule, String> {
    fun findByHouseIdOrderByDateAscCounselorIdAsc(houseId: String): List<CounselorSchedule>

    fun deleteByHouseIdAndDate(houseId: String, date: String)
}
