package com.rehabcenter.web

import com.rehabcenter.domain.Shift
import com.rehabcenter.repo.ShiftRepository
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
@RequestMapping("/api/shifts")
class ShiftController(
    private val shifts: ShiftRepository,
) {
    @GetMapping
    fun list(
        @RequestParam(required = false) @Size(min = 1, max = UiValidation.ID_MAX) houseId: String?,
        @RequestParam(required = false) @Size(min = 1, max = UiValidation.DATE_UI_MAX) date: String?,
    ): List<Shift> {
        val h = houseId?.takeIf { it.isNotBlank() }
        val d = date?.takeIf { it.isNotBlank() }
        return shifts.search(h, d)
    }

    data class CreateShiftBody(
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val houseId: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val counselorId: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.DATE_UI_MAX)
        val date: String? = null,
        @field:Size(max = UiValidation.SHIFT_TYPE_MAX)
        val shift: String? = null,
        @field:Size(max = UiValidation.NOTE_MAX)
        val note: String? = null,
        @field:Size(max = UiValidation.HANDOFF_NAME_MAX)
        val receivedFrom: String? = null,
        @field:Size(max = UiValidation.TIME_HHMM_MAX)
        @field:Pattern(regexp = UiValidation.TIME_HHMM_PATTERN)
        val start: String? = null,
    )

    @Transactional
    @PostMapping
    fun create(@RequestBody @Valid body: CreateShiftBody): ResponseEntity<Any> {
        val now = Instant.now()
        val s =
            Shift(
                id = UUID.randomUUID().toString(),
                houseId = body.houseId!!,
                counselorId = body.counselorId!!,
                date = body.date!!,
                shift = body.shift ?: "24h",
                status = "ACTIVE",
                note = body.note,
                receivedFrom = body.receivedFrom,
                start = body.start,
                createdAt = now,
                updatedAt = now,
            )
        val saved = shifts.save(s)
        val withCounselor = shifts.fetchWithCounselorById(saved.id) ?: saved
        return ResponseEntity.status(201).body(withCounselor)
    }

    data class ShiftPatchBody(
        @field:Pattern(regexp = UiValidation.SHIFT_STATUS)
        val status: String? = null,
        @field:Size(max = UiValidation.NOTE_MAX)
        val note: String? = null,
        @field:Size(max = UiValidation.HANDOFF_NAME_MAX)
        val receivedFrom: String? = null,
        @field:Size(max = UiValidation.HANDOFF_NAME_MAX)
        val handedTo: String? = null,
        val accepted: Boolean? = null,
        @field:Size(max = UiValidation.TIME_HHMM_MAX)
        @field:Pattern(regexp = UiValidation.TIME_HHMM_PATTERN)
        val start: String? = null,
        @field:Size(max = UiValidation.TIME_HHMM_MAX)
        @field:Pattern(regexp = UiValidation.TIME_HHMM_PATTERN)
        val end: String? = null,
    )

    @Transactional
    @PatchMapping("/{id}")
    fun patch(
        @PathVariable @Size(min = 1, max = UiValidation.ID_MAX) id: String,
        @RequestBody @Valid body: ShiftPatchBody,
    ): ResponseEntity<Any> {
        val s = shifts.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        body.status?.let { s.status = it }
        body.note?.let { s.note = it }
        body.receivedFrom?.let { s.receivedFrom = it }
        body.handedTo?.let { s.handedTo = it }
        body.accepted?.let { s.accepted = it }
        body.start?.let { s.start = it }
        body.end?.let { s.end = it }
        s.updatedAt = Instant.now()
        val saved = shifts.save(s)
        val withCounselor = shifts.fetchWithCounselorById(saved.id) ?: saved
        return ResponseEntity.ok(withCounselor)
    }
}
