package com.rehabcenter.repo

import com.rehabcenter.domain.CashboxCount
import com.rehabcenter.domain.CashboxEntry
import org.springframework.data.jpa.repository.JpaRepository

interface CashboxEntryRepository : JpaRepository<CashboxEntry, String> {
    fun findByHouseIdOrderByCreatedAtDesc(houseId: String): List<CashboxEntry>
}

interface CashboxCountRepository : JpaRepository<CashboxCount, String> {
    fun findByHouseIdOrderByCreatedAtDesc(houseId: String): List<CashboxCount>
}
