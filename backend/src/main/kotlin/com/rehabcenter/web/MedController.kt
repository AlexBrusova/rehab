package com.rehabcenter.web

import com.rehabcenter.domain.Med
import com.rehabcenter.error.ApiBusinessException
import com.rehabcenter.repo.MedRepository
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
import java.time.Instant
import java.util.UUID

@Validated
@RestController
@RequestMapping("/api/meds")
class MedController(
    private val meds: MedRepository,
) {
    private val medTimeSlotRegex = UiValidation.MED_TIME_SLOT.toRegex()

    private fun validatedTimes(times: List<String>?): List<String> {
        val list = times ?: emptyList()
        if (list.size > UiValidation.MED_TIMES_LIST_MAX) {
            throw ApiBusinessException(
                HttpStatus.BAD_REQUEST,
                "At most ${UiValidation.MED_TIMES_LIST_MAX} administration times allowed",
                "med_times_limit",
            )
        }
        for (t in list) {
            if (!t.matches(medTimeSlotRegex)) {
                throw ApiBusinessException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid time slot: $t (expected morning|noon|evening|night)",
                    "med_time_slot",
                )
            }
        }
        return list
    }

    @GetMapping
    fun list(
        @RequestParam @NotBlank @Size(max = UiValidation.ID_MAX) patientId: String,
    ): ResponseEntity<Any> = ResponseEntity.ok(meds.findByPatientIdOrderByCreatedAtAsc(patientId))

    data class CreateMedBody(
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val patientId: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.MED_NAME_MAX)
        val name: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.MED_DOSE_MAX)
        val dose: String? = null,
        @field:Size(max = UiValidation.MED_UNIT_MAX)
        val unit: String? = null,
        @field:Size(max = UiValidation.MED_TIMES_LIST_MAX)
        val times: List<String>? = null,
        @field:Size(max = UiValidation.MED_PRESCRIBED_BY_MAX)
        val prescribedBy: String? = null,
        @field:Size(max = UiValidation.DATE_UI_MAX)
        val startDate: String? = null,
        @field:Size(max = UiValidation.DATE_UI_MAX)
        val endDate: String? = null,
        @field:Size(max = UiValidation.NOTE_MAX)
        val notes: String? = null,
    )

    @Transactional
    @PostMapping
    fun create(@RequestBody @Valid body: CreateMedBody): ResponseEntity<Any> {
        val now = Instant.now()
        val times = validatedTimes(body.times)
        val m =
            Med(
                id = UUID.randomUUID().toString(),
                patientId = body.patientId!!,
                name = body.name!!,
                dose = body.dose!!,
                unit = body.unit ?: "mg",
                times = times,
                startDate = body.startDate,
                endDate = body.endDate,
                prescribedBy = body.prescribedBy,
                notes = body.notes,
                createdAt = now,
                updatedAt = now,
            )
        return ResponseEntity.status(201).body(meds.save(m))
    }

    data class MedPatchBody(
        @field:Size(max = UiValidation.MED_NAME_MAX)
        val name: String? = null,
        @field:Size(max = UiValidation.MED_DOSE_MAX)
        val dose: String? = null,
        @field:Size(max = UiValidation.MED_UNIT_MAX)
        val unit: String? = null,
        @field:Size(max = UiValidation.MED_TIMES_LIST_MAX)
        val times: List<String>? = null,
        @field:Size(max = UiValidation.DATE_UI_MAX)
        val startDate: String? = null,
        @field:Size(max = UiValidation.DATE_UI_MAX)
        val endDate: String? = null,
        @field:Size(max = UiValidation.MED_PRESCRIBED_BY_MAX)
        val prescribedBy: String? = null,
        @field:Size(max = UiValidation.NOTE_MAX)
        val notes: String? = null,
    )

    @Transactional
    @PatchMapping("/{id}")
    fun patch(
        @PathVariable @Size(min = 1, max = UiValidation.ID_MAX) id: String,
        @RequestBody @Valid body: MedPatchBody,
    ): ResponseEntity<Any> {
        val m = meds.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        body.name?.let { m.name = it }
        body.dose?.let { m.dose = it }
        body.unit?.let { m.unit = it }
        body.times?.let { m.times = validatedTimes(it) }
        body.startDate?.let { m.startDate = it }
        body.endDate?.let { m.endDate = it }
        body.prescribedBy?.let { m.prescribedBy = it }
        body.notes?.let { m.notes = it }
        m.updatedAt = Instant.now()
        return ResponseEntity.ok(meds.save(m))
    }

    @Transactional
    @DeleteMapping("/{id}")
    fun delete(
        @PathVariable @Size(min = 1, max = UiValidation.ID_MAX) id: String,
    ): ResponseEntity<Any> {
        if (!meds.existsById(id)) return ResponseEntity.notFound().build()
        meds.deleteById(id)
        return ResponseEntity.ok(mapOf("ok" to true))
    }
}
