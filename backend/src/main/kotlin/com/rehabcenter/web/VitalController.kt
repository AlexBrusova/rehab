package com.rehabcenter.web

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.rehabcenter.domain.Vital
import com.rehabcenter.repo.VitalRepository
import com.rehabcenter.validation.UiValidation
import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.util.UUID

@Validated
@RestController
@RequestMapping("/api/vitals")
class VitalController(
    private val vitals: VitalRepository,
) {
    @GetMapping
    fun list(
        @RequestParam @NotBlank @Size(max = UiValidation.ID_MAX) houseId: String,
    ): ResponseEntity<Any> =
        ResponseEntity.ok(vitals.findByHouseIdOrderByDateDescCreatedAtDesc(houseId))

    @JsonIgnoreProperties(ignoreUnknown = true)
    data class CreateVitalBody(
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val patientId: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val houseId: String? = null,
        @field:NotNull @field:Min(UiValidation.VITAL_VALUE_MIN.toLong()) @field:Max(UiValidation.VITAL_VALUE_MAX.toLong())
        val systolic: Int? = null,
        @field:NotNull @field:Min(UiValidation.VITAL_VALUE_MIN.toLong()) @field:Max(UiValidation.VITAL_VALUE_MAX.toLong())
        val diastolic: Int? = null,
        @field:NotNull @field:Min(UiValidation.VITAL_VALUE_MIN.toLong()) @field:Max(UiValidation.VITAL_VALUE_MAX.toLong())
        val pulse: Int? = null,
        @field:Size(max = UiValidation.NOTE_MAX)
        val note: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.DATE_UI_MAX)
        val date: String? = null,
    )

    @Transactional
    @PostMapping
    fun create(
        @RequestBody @Valid body: CreateVitalBody,
    ): ResponseEntity<Any> {
        val v =
            Vital(
                id = UUID.randomUUID().toString(),
                patientId = body.patientId!!,
                houseId = body.houseId!!,
                systolic = body.systolic!!,
                diastolic = body.diastolic!!,
                pulse = body.pulse!!,
                note = body.note ?: "",
                date = body.date!!,
                createdAt = Instant.now(),
            )
        return ResponseEntity.status(201).body(vitals.save(v))
    }
}
