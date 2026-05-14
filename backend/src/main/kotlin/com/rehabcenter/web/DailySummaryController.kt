package com.rehabcenter.web

import com.rehabcenter.domain.DailySummary
import com.rehabcenter.repo.DailySummaryRepository
import com.rehabcenter.validation.UiValidation
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
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
@RequestMapping("/api/summaries")
class DailySummaryController(
    private val summaries: DailySummaryRepository,
) {
    @GetMapping
    fun list(
        @RequestParam @NotBlank @Size(max = UiValidation.ID_MAX) houseId: String,
        @RequestParam(required = false) @Size(min = 1, max = UiValidation.DATE_UI_MAX) date: String?,
    ): ResponseEntity<Any> =
        ResponseEntity.ok(summaries.search(houseId, date?.takeIf { it.isNotBlank() }))

    data class CreateSummaryBody(
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val counselorId: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val houseId: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.DATE_UI_MAX)
        val date: String? = null,
        @field:Size(max = UiValidation.NOTE_MAX)
        val generalText: String? = null,
        @field:Size(max = 150)
        val patientSummaries: Map<String, String>? = null,
        @field:Size(max = 64)
        val notifiedAt: String? = null,
    )

    @Transactional
    @PostMapping
    fun create(@RequestBody @Valid body: CreateSummaryBody): ResponseEntity<Any> {
        val s =
            DailySummary(
                id = UUID.randomUUID().toString(),
                counselorId = body.counselorId!!,
                houseId = body.houseId!!,
                date = body.date!!,
                generalText = body.generalText ?: "",
                patientSummaries = body.patientSummaries ?: linkedMapOf(),
                notifiedAt = body.notifiedAt,
                createdAt = Instant.now(),
            )
        return ResponseEntity.status(201).body(summaries.save(s))
    }

    data class PatchSummaryBody(
        @field:Size(max = UiValidation.NOTE_MAX)
        val generalText: String? = null,
        @field:Size(max = 150)
        val patientSummaries: Map<String, String>? = null,
        @field:Size(max = 64)
        val notifiedAt: String? = null,
    )

    @Transactional
    @PatchMapping("/{id}")
    fun patch(
        @PathVariable @Size(min = 1, max = UiValidation.ID_MAX) id: String,
        @RequestBody @Valid body: PatchSummaryBody,
    ): ResponseEntity<Any> {
        val s = summaries.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        body.generalText?.let { s.generalText = it }
        body.patientSummaries?.let { s.patientSummaries = LinkedHashMap(it) }
        body.notifiedAt?.let { s.notifiedAt = it }
        return ResponseEntity.ok(summaries.save(s))
    }
}
