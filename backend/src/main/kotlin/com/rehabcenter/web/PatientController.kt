package com.rehabcenter.web

import com.fasterxml.jackson.databind.JsonNode
import com.rehabcenter.domain.Patient
import com.rehabcenter.repo.HouseRepository
import com.rehabcenter.repo.PatientRepository
import com.rehabcenter.repo.RoomRepository
import com.rehabcenter.validation.UiValidation
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.util.UUID

@Validated
@RestController
@RequestMapping("/api/patients")
class PatientController(
    private val patients: PatientRepository,
    private val houses: HouseRepository,
    private val rooms: RoomRepository,
) {
    @GetMapping("/archived")
    fun listArchived(
        @RequestParam @NotBlank @Size(max = UiValidation.ID_MAX) houseId: String,
    ): List<Patient> = patients.findByHouseIdAndPatientRecordStatusOrderByNameAsc(houseId, "archived")

    @GetMapping
    fun list(
        @RequestParam(required = false) @Size(min = 1, max = UiValidation.ID_MAX) houseId: String?,
    ): List<Patient> =
        if (houseId.isNullOrBlank()) {
            patients.findByPatientRecordStatusOrderByNameAsc("active")
        } else {
            patients.findByHouseIdAndPatientRecordStatusOrderByNameAsc(houseId, "active")
        }

    data class CreatePatientBody(
        @field:NotBlank(message = "Name is required")
        @field:Size(max = UiValidation.NAME_MAX, message = "Name must be at most ${UiValidation.NAME_MAX} characters")
        val name: String? = null,
        @field:NotBlank(message = "Date of birth is required")
        @field:Size(max = UiValidation.DATE_UI_MAX, message = "Date of birth value is too long")
        val dob: String? = null,
        @field:NotBlank(message = "Admit date is required")
        @field:Size(max = UiValidation.DATE_UI_MAX, message = "Admit date value is too long")
        val admitDate: String? = null,
        @field:NotBlank(message = "House is required")
        @field:Size(max = UiValidation.ID_MAX, message = "House ID is too long")
        val houseId: String? = null,
        @field:Size(max = UiValidation.ID_MAX, message = "Room ID is too long")
        val roomId: String? = null,
    )

    @Transactional
    @PostMapping
    fun create(@RequestBody @Valid body: CreatePatientBody): ResponseEntity<Any> {
        val houseId = body.houseId!!
        if (!houses.existsById(houseId)) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "House not found")
        }
        val roomId = body.roomId
        if (roomId != null) {
            val room = rooms.findById(roomId).orElseThrow {
                ResponseStatusException(HttpStatus.BAD_REQUEST, "Room not found")
            }
            if (room.houseId != houseId) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Room does not belong to the specified house")
            }
        }
        val p =
            Patient(
                id = UUID.randomUUID().toString(),
                name = body.name!!,
                dob = body.dob!!,
                admitDate = body.admitDate!!,
                houseId = houseId,
                roomId = roomId,
                patientRecordStatus = "active",
                createdAt = Instant.now(),
                updatedAt = Instant.now(),
            )
        patients.save(p)
        return ResponseEntity.status(201).body(patients.findWithRoomAndMedsById(p.id)!!)
    }

    @Transactional
    @PatchMapping("/{id}")
    fun patch(
        @PathVariable @Size(min = 1, max = UiValidation.ID_MAX) id: String,
        @RequestBody node: JsonNode,
    ): ResponseEntity<Any> {
        val p = patients.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        fun textOrNull(field: String): String? =
            when {
                !node.has(field) -> null
                node[field].isNull -> null
                else -> node[field].asText()
            }
        textOrNull("name")?.let { name ->
            if (name.length > UiValidation.NAME_MAX) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Name must be at most ${UiValidation.NAME_MAX} characters")
            }
            p.name = name
        }
        textOrNull("dob")?.let { dob ->
            if (dob.length > UiValidation.DATE_UI_MAX) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Date of birth value is too long")
            }
            p.dob = dob
        }
        textOrNull("admitDate")?.let { admitDate ->
            if (admitDate.length > UiValidation.DATE_UI_MAX) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Admit date value is too long")
            }
            p.admitDate = admitDate
        }
        textOrNull("roomId")?.let { roomId ->
            if (roomId.length > UiValidation.ID_MAX) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Room ID is too long")
            }
            p.roomId = roomId
        }
        if (node.has("mood")) {
            if (!node["mood"].isNumber) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Mood must be a number between 0 and 10")
            }
            val m = node["mood"].asInt()
            if (m !in 0..10) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Mood must be between 0 and 10")
            }
            p.mood = m
        }
        if (node.has("alert")) {
            if (!node["alert"].isBoolean) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Alert must be a boolean")
            }
            p.alert = node["alert"].asBoolean()
        }
        textOrNull("status")?.let { status ->
            if (!status.matches(Regex(UiValidation.PATIENT_STATUS))) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status value: must be 'active' or 'archived'")
            }
            p.patientRecordStatus = status
        }
        textOrNull("dischargeType")?.let { dischargeType ->
            if (dischargeType.length > UiValidation.SHORT_LABEL) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Discharge type value is too long")
            }
            p.dischargeType = dischargeType
        }
        textOrNull("dischargeDate")?.let { dischargeDate ->
            if (dischargeDate.length > UiValidation.DATE_UI_MAX) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Discharge date value is too long")
            }
            p.dischargeDate = dischargeDate
        }
        if (node.has("daysInRehab")) {
            if (!node["daysInRehab"].isNumber) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Days in rehab must be a number")
            }
            val d = node["daysInRehab"].asInt()
            if (d !in 0..100_000) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Days in rehab must be between 0 and 100000")
            }
            p.daysInRehab = d
        }
        if (node.has("awayType")) {
            p.awayType = textOrNull("awayType")
        }
        p.updatedAt = Instant.now()
        patients.save(p)
        return ResponseEntity.ok(patients.findWithRoomAndMedsById(id)!!)
    }

    @Transactional
    @DeleteMapping("/{id}")
    fun archive(
        @PathVariable @Size(min = 1, max = UiValidation.ID_MAX) id: String,
    ): ResponseEntity<Any> {
        val p = patients.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        p.patientRecordStatus = "archived"
        p.updatedAt = Instant.now()
        patients.save(p)
        return ResponseEntity.ok(mapOf("ok" to true))
    }
}
