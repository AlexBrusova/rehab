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
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.UUID

/** Legacy Express path `/api/summary` used by the current React app. */
@Validated
@RestController
@RequestMapping("/api/summary")
class SummaryCompatController(
    private val summaries: DailySummaryRepository,
) {
    private val gbDate: DateTimeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")

    @GetMapping
    fun list(
        @RequestParam @NotBlank @Size(max = UiValidation.ID_MAX) houseId: String,
    ): ResponseEntity<Any> =
        ResponseEntity.ok(summaries.search(houseId, null))

    data class CreateSummaryCompatBody(
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val counselorId: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val houseId: String? = null,
        @field:Size(max = UiValidation.DATE_UI_MAX)
        val date: String? = null,
        @field:Size(max = UiValidation.NOTE_MAX)
        val generalText: String? = null,
        @field:Size(max = 150)
        val patientSummaries: Map<String, String>? = null,
    )

    @Transactional
    @PostMapping
    fun create(@RequestBody @Valid body: CreateSummaryCompatBody): ResponseEntity<Any> {
        val date =
            body.date?.takeIf { it.isNotBlank() }
                ?: ZonedDateTime.now(ZoneId.systemDefault()).format(gbDate)
        val notifiedAt =
            ZonedDateTime.now(ZoneId.systemDefault())
                .toLocalTime()
                .toString()
                .take(5)
        val s =
            DailySummary(
                id = UUID.randomUUID().toString(),
                counselorId = body.counselorId!!,
                houseId = body.houseId!!,
                date = date,
                generalText = body.generalText ?: "",
                patientSummaries = body.patientSummaries ?: linkedMapOf(),
                notifiedAt = notifiedAt,
                createdAt = Instant.now(),
            )
        return ResponseEntity.status(201).body(summaries.save(s))
    }
}
