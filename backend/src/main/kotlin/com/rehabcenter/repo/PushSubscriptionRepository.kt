package com.rehabcenter.repo

import com.rehabcenter.domain.PushSubscription
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface PushSubscriptionRepository : JpaRepository<PushSubscription, String> {
    fun findByUserId(userId: String): List<PushSubscription>
    fun findByEndpoint(endpoint: String): PushSubscription?

    @Query("select s from PushSubscription s where s.houseId = :houseId")
    fun findByHouseId(houseId: String): List<PushSubscription>

    @Query(
        """select s from PushSubscription s
           join AppUser u on u.id = s.userId
           where u.role in ('manager','org_manager') and (u.houseId = :houseId or u.allHousesAccess = true)""",
    )
    fun findManagersForHouse(houseId: String): List<PushSubscription>
}
