package com.rehabcenter.web

import com.rehabcenter.domain.MedDistribution
import com.rehabcenter.repo.MedDistributionRepository
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
@RequestMapping("/api/med-distributions")
class MedDistributionController(
    private val distributions: MedDistributionRepository,
) {
    @GetMapping
    fun list(
        @RequestParam @NotBlank @Size(max = UiValidation.ID_MAX) patientId: String,
        @RequestParam @NotBlank @Size(max = UiValidation.DATE_UI_MAX) date: String,
    ): ResponseEntity<Any> =
        ResponseEntity.ok(distributions.findByPatientIdAndDateOrderByTimeAsc(patientId, date))

    data class CreateDistributionBody(
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val patientId: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val medId: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.DATE_UI_MAX)
        val date: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.TIME_HHMM_MAX)
        @field:Pattern(regexp = UiValidation.TIME_HHMM_PATTERN)
        val time: String? = null,
        val given: Boolean? = false,
    )

    @Transactional
    @PostMapping
    fun create(@RequestBody @Valid body: CreateDistributionBody): ResponseEntity<Any> {
        val d =
            MedDistribution(
                id = UUID.randomUUID().toString(),
                patientId = body.patientId!!,
                medId = body.medId!!,
                date = body.date!!,
                time = body.time!!,
                given = body.given ?: false,
                createdAt = Instant.now(),
            )
        return ResponseEntity.status(201).body(distributions.save(d))
    }

    data class PatchDistributionBody(
        val given: Boolean? = null,
        @field:Size(max = UiValidation.TIME_HHMM_MAX)
        @field:Pattern(regexp = UiValidation.TIME_HHMM_PATTERN)
        val givenAt: String? = null,
        @field:Size(max = UiValidation.NAME_MAX)
        val givenBy: String? = null,
    )

    @Transactional
    @PatchMapping("/{id}")
    fun patch(
        @PathVariable @Size(min = 1, max = UiValidation.ID_MAX) id: String,
        @RequestBody @Valid body: PatchDistributionBody,
    ): ResponseEntity<Any> {
        val d = distributions.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        body.given?.let { d.given = it }
        body.givenAt?.let { d.givenAt = it }
        body.givenBy?.let { d.givenBy = it }
        return ResponseEntity.ok(distributions.save(d))
    }
}
