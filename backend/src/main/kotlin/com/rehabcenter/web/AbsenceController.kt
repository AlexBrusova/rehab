package com.rehabcenter.web

import com.rehabcenter.domain.Absence
import com.rehabcenter.repo.AbsenceRepository
import com.rehabcenter.validation.UiValidation
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.validation.annotation.Validated
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
@RequestMapping("/api/absences")
class AbsenceController(
    private val absences: AbsenceRepository,
) {
    @GetMapping
    fun list(
        @RequestParam @NotBlank @Size(max = UiValidation.ID_MAX) houseId: String,
    ): ResponseEntity<Any> =
        ResponseEntity.ok(absences.findByHouseIdOrderByCreatedAtDesc(houseId))

    data class CreateAbsenceBody(
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val patientId: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val houseId: String? = null,
        @field:Size(max = UiValidation.SHORT_LABEL)
        val type: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.DATE_UI_MAX)
        val startDate: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.DATE_UI_MAX)
        val endDate: String? = null,
    )

    @Transactional
    @PostMapping
    fun create(@RequestBody @Valid body: CreateAbsenceBody): ResponseEntity<Any> {
        val a =
            Absence(
                id = UUID.randomUUID().toString(),
                patientId = body.patientId!!,
                houseId = body.houseId!!,
                type = body.type ?: "",
                startDate = body.startDate!!,
                endDate = body.endDate!!,
                status = "pending",
                createdAt = Instant.now(),
            )
        return ResponseEntity.status(201).body(absences.save(a))
    }

    data class PatchAbsenceBody(
        @field:Pattern(regexp = UiValidation.ABSENCE_STATUS)
        val status: String? = null,
        @field:Size(max = UiValidation.NAME_MAX)
        val approvedBy: String? = null,
        @field:Size(max = 64)
        val returnedAt: String? = null,
    )

    @Transactional
    @PatchMapping("/{id}")
    fun patch(
        @PathVariable @Size(min = 1, max = UiValidation.ID_MAX) id: String,
        @RequestBody @Valid body: PatchAbsenceBody,
    ): ResponseEntity<Any> {
        val a = absences.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        body.status?.let { a.status = it }
        body.approvedBy?.let { a.approvedBy = it }
        body.returnedAt?.let { a.returnedAt = it }
        return ResponseEntity.ok(absences.save(a))
    }
}
