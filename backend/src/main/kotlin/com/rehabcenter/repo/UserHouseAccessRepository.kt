package com.rehabcenter.repo

import com.rehabcenter.domain.UserHouseAccess
import com.rehabcenter.domain.UserHouseAccessId
import org.springframework.data.jpa.repository.JpaRepository

interface UserHouseAccessRepository : JpaRepository<UserHouseAccess, UserHouseAccessId>
