package com.rehabcenter.web

import com.rehabcenter.domain.TherapistAssignment
import com.rehabcenter.domain.TherapySession
import com.rehabcenter.repo.TherapistAssignmentRepository
import com.rehabcenter.repo.TherapySessionRepository
import com.rehabcenter.validation.UiValidation
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.springframework.http.ResponseEntity
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
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.UUID

@Validated
@RestController
@RequestMapping("/api/therapy")
class TherapyController(
    private val assignments: TherapistAssignmentRepository,
    private val sessions: TherapySessionRepository,
) {
    private val gbDate: DateTimeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")

    private fun todayEnGb(): String = ZonedDateTime.now(ZoneId.systemDefault()).format(gbDate)

    @GetMapping
    fun listByHouse(
        @RequestParam @NotBlank @Size(max = UiValidation.ID_MAX) houseId: String,
    ): ResponseEntity<Any> =
        ResponseEntity.ok(sessions.findByPatientHouseId(houseId))

    data class LegacyExpressCreateSessionBody(
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val patientId: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val therapistId: String? = null,
        @field:Size(max = UiValidation.DATE_UI_MAX)
        val date: String? = null,
        @field:Size(max = UiValidation.TOPIC_MAX)
        val topic: String? = null,
        @field:Size(max = UiValidation.NOTE_MAX)
        val notes: String? = null,
        @field:Size(max = UiValidation.NOTE_MAX)
        val counselorNote: String? = null,
        @field:Pattern(regexp = UiValidation.THERAPY_URGENCY)
        val urgency: String? = "NORMAL",
    )

    /** Legacy Express `POST /api/therapy` (server-side date, optional counselor note). */
    @PostMapping
    fun createExpressSession(@RequestBody @Valid body: LegacyExpressCreateSessionBody): ResponseEntity<Any> {
        val now = Instant.now()
        val s =
            TherapySession(
                id = UUID.randomUUID().toString(),
                patientId = body.patientId!!,
                therapistId = body.therapistId!!,
                date = body.date?.takeIf { it.isNotBlank() } ?: todayEnGb(),
                topic = body.topic ?: "",
                notes = body.notes ?: "",
                urgency = body.urgency ?: "NORMAL",
                counselorNote = body.counselorNote?.takeIf { it.isNotBlank() },
                createdAt = now,
                updatedAt = now,
            )
        return ResponseEntity.status(201).body(sessions.save(s))
    }

    data class AssignmentBody(
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val patientId: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val therapistId: String? = null,
    )

    @GetMapping("/assignments")
    fun listAssignments(
        @RequestParam @NotBlank @Size(max = UiValidation.ID_MAX) houseId: String,
    ): ResponseEntity<Any> =
        ResponseEntity.ok(assignments.findByPatientHouseId(houseId))

    @PostMapping("/assignments")
    fun createAssignment(@RequestBody @Valid body: AssignmentBody): ResponseEntity<Any> {
        val a = TherapistAssignment(patientId = body.patientId!!, therapistId = body.therapistId!!)
        return ResponseEntity.status(201).body(assignments.save(a))
    }

    data class PatchAssignmentBody(
        @field:Size(min = 1, max = UiValidation.ID_MAX)
        val therapistId: String? = null,
    )

    @PatchMapping("/assignments/{patientId}")
    fun patchAssignment(
        @PathVariable @Size(min = 1, max = UiValidation.ID_MAX) patientId: String,
        @RequestBody @Valid body: PatchAssignmentBody,
    ): ResponseEntity<Any> {
        val a = assignments.findById(patientId).orElse(null) ?: return ResponseEntity.notFound().build()
        body.therapistId?.let { a.therapistId = it }
        return ResponseEntity.ok(assignments.save(a))
    }

    @GetMapping("/sessions")
    fun listSessions(
        @RequestParam @NotBlank @Size(max = UiValidation.ID_MAX) patientId: String,
    ): ResponseEntity<Any> =
        ResponseEntity.ok(sessions.findByPatientIdOrderByDateDescCreatedAtDesc(patientId))

    data class CreateSessionBody(
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val patientId: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val therapistId: String? = null,
        @field:Size(max = UiValidation.DATE_UI_MAX)
        val date: String? = null,
        @field:Size(max = UiValidation.TOPIC_MAX)
        val topic: String? = null,
        @field:Size(max = UiValidation.NOTE_MAX)
        val notes: String? = null,
        @field:Pattern(regexp = UiValidation.THERAPY_URGENCY)
        val urgency: String? = "NORMAL",
    )

    @PostMapping("/sessions")
    fun createSession(@RequestBody @Valid body: CreateSessionBody): ResponseEntity<Any> {
        val now = Instant.now()
        val s =
            TherapySession(
                id = UUID.randomUUID().toString(),
                patientId = body.patientId!!,
                therapistId = body.therapistId!!,
                date = body.date?.takeIf { it.isNotBlank() } ?: todayEnGb(),
                topic = body.topic ?: "",
                notes = body.notes ?: "",
                urgency = body.urgency ?: "NORMAL",
                createdAt = now,
                updatedAt = now,
            )
        return ResponseEntity.status(201).body(sessions.save(s))
    }

    data class PatchSessionBody(
        @field:Size(max = UiValidation.TOPIC_MAX)
        val topic: String? = null,
        @field:Size(max = UiValidation.NOTE_MAX)
        val notes: String? = null,
        @field:Pattern(regexp = UiValidation.THERAPY_URGENCY)
        val urgency: String? = null,
        @field:Size(max = UiValidation.NOTE_MAX)
        val counselorNote: String? = null,
    )

    @PatchMapping("/sessions/{id}")
    fun patchSession(
        @PathVariable @Size(min = 1, max = UiValidation.ID_MAX) id: String,
        @RequestBody @Valid body: PatchSessionBody,
    ): ResponseEntity<Any> {
        val s = sessions.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        body.topic?.let { s.topic = it }
        body.notes?.let { s.notes = it }
        body.urgency?.let { s.urgency = it }
        body.counselorNote?.let { s.counselorNote = it }
        s.updatedAt = Instant.now()
        return ResponseEntity.ok(sessions.save(s))
    }
}
