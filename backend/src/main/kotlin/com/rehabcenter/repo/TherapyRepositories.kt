package com.rehabcenter.repo

import com.rehabcenter.domain.TherapistAssignment
import com.rehabcenter.domain.TherapySession
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface TherapistAssignmentRepository : JpaRepository<TherapistAssignment, String> {
    @Query("select ta from TherapistAssignment ta join Patient p on ta.patientId = p.id where p.houseId = :houseId")
    fun findByPatientHouseId(@Param("houseId") houseId: String): List<TherapistAssignment>
}

interface TherapySessionRepository : JpaRepository<TherapySession, String> {
    fun findByPatientIdOrderByDateDescCreatedAtDesc(patientId: String): List<TherapySession>

    @Query(
        """
        select s from TherapySession s
        join Patient p on s.patientId = p.id
        where p.houseId = :houseId
        order by s.createdAt desc
        """,
    )
    fun findByPatientHouseId(@Param("houseId") houseId: String): List<TherapySession>
}
