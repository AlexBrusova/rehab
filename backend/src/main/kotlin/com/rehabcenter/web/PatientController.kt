package com.rehabcenter.web

import com.fasterxml.jackson.databind.JsonNode
import com.rehabcenter.domain.Patient
import com.rehabcenter.repo.PatientRepository
import com.rehabcenter.validation.UiValidation
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
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
import java.time.Instant
import java.util.UUID

@Validated
@RestController
@RequestMapping("/api/patients")
class PatientController(
    private val patients: PatientRepository,
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
        @field:NotBlank @field:Size(max = UiValidation.NAME_MAX)
        val name: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.DATE_UI_MAX)
        val dob: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.DATE_UI_MAX)
        val admitDate: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val houseId: String? = null,
        @field:Size(max = UiValidation.ID_MAX)
        val roomId: String? = null,
    )

    @Transactional
    @PostMapping
    fun create(@RequestBody @Valid body: CreatePatientBody): ResponseEntity<Any> {
        val p =
            Patient(
                id = UUID.randomUUID().toString(),
                name = body.name!!,
                dob = body.dob!!,
                admitDate = body.admitDate!!,
                houseId = body.houseId!!,
                roomId = body.roomId,
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
        textOrNull("name")?.takeIf { it.length <= UiValidation.NAME_MAX }?.let { p.name = it }
        textOrNull("dob")?.takeIf { it.length <= UiValidation.DATE_UI_MAX }?.let { p.dob = it }
        textOrNull("admitDate")?.takeIf { it.length <= UiValidation.DATE_UI_MAX }?.let { p.admitDate = it }
        textOrNull("roomId")?.takeIf { it.length <= UiValidation.ID_MAX }?.let { p.roomId = it }
        if (node.has("mood") && node["mood"].isNumber) {
            val m = node["mood"].asInt()
            if (m in 0..10) p.mood = m
        }
        if (node.has("alert") && node["alert"].isBoolean) {
            p.alert = node["alert"].asBoolean()
        }
        textOrNull("status")?.takeIf { it.matches(Regex(UiValidation.PATIENT_STATUS)) }?.let { p.patientRecordStatus = it }
        textOrNull("dischargeType")?.takeIf { it.length <= UiValidation.SHORT_LABEL }?.let { p.dischargeType = it }
        textOrNull("dischargeDate")?.takeIf { it.length <= UiValidation.DATE_UI_MAX }?.let { p.dischargeDate = it }
        if (node.has("daysInRehab") && node["daysInRehab"].isNumber) {
            val d = node["daysInRehab"].asInt()
            if (d in 0..100_000) p.daysInRehab = d
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
