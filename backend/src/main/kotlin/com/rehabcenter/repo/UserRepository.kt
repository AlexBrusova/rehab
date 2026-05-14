package com.rehabcenter.repo

import com.rehabcenter.domain.AppUser
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface UserRepository : JpaRepository<AppUser, String> {
    @EntityGraph(attributePaths = ["house", "allowedHouses"])
    @Query("select u from AppUser u where u.username = :username")
    fun findDetailsByUsername(username: String): AppUser?

    @EntityGraph(attributePaths = ["house", "allowedHouses"])
    fun findAllByOrderByNameAsc(): List<AppUser>
}
