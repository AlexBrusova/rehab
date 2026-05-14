package com.rehabcenter.repo

import com.rehabcenter.domain.Patient
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface PatientRepository : JpaRepository<Patient, String> {
    @EntityGraph(attributePaths = ["room", "meds"])
    @Query("select p from Patient p where p.id = :id")
    fun findWithRoomAndMedsById(id: String): Patient?

    @EntityGraph(attributePaths = ["room", "meds"])
    fun findByPatientRecordStatusOrderByNameAsc(patientRecordStatus: String): List<Patient>

    @EntityGraph(attributePaths = ["room", "meds"])
    fun findByHouseIdAndPatientRecordStatusOrderByNameAsc(houseId: String, patientRecordStatus: String): List<Patient>

    fun existsByRoomId(roomId: String): Boolean
}
