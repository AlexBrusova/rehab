package com.rehabcenter.web

import com.rehabcenter.domain.GroupAttendance
import com.rehabcenter.domain.GroupAttendanceId
import com.rehabcenter.domain.ResidentGroup
import com.rehabcenter.repo.PatientRepository
import com.rehabcenter.repo.ResidentGroupRepository
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
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.util.UUID

@Validated
@RestController
@RequestMapping("/api/groups")
class GroupController(
    private val groups: ResidentGroupRepository,
    private val patients: PatientRepository,
) {
    @GetMapping
    fun list(
        @RequestParam @NotBlank @Size(max = UiValidation.ID_MAX) houseId: String,
        @RequestParam(required = false) @Size(min = 1, max = UiValidation.DATE_UI_MAX) date: String?,
    ): ResponseEntity<Any> =
        ResponseEntity.ok(groups.search(houseId, date?.takeIf { it.isNotBlank() }))

    data class AttendanceRow(
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val patientId: String? = null,
        @field:Pattern(regexp = "^(present|absent)$")
        val status: String? = null,
    )

    data class PatchAttendanceRow(
        @field:Size(max = UiValidation.ID_MAX)
        val patientId: String? = null,
        @field:Pattern(regexp = "^(present|absent)$")
        val status: String? = null,
    )

    data class CreateGroupBody(
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val houseId: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.DATE_UI_MAX)
        val date: String? = null,
        @field:Size(max = UiValidation.TOPIC_MAX)
        val topic: String? = null,
        @field:Size(max = UiValidation.ID_MAX)
        val leaderId: String? = null,
        @field:Size(max = UiValidation.NOTE_MAX)
        val notes: String? = null,
        @field:Size(max = UiValidation.SHORT_LABEL)
        val type: String? = null,
        @field:Size(max = UiValidation.TIME_HHMM_MAX)
        val time: String? = null,
        @field:Size(max = UiValidation.SHORT_LABEL)
        val status: String? = null,
        @field:Valid
        @field:Size(max = 200)
        val attendance: List<AttendanceRow>? = null,
    )

    @PostMapping
    fun create(@RequestBody @Valid body: CreateGroupBody): ResponseEntity<Any> {
        val now = Instant.now()
        val g =
            ResidentGroup(
                id = UUID.randomUUID().toString(),
                houseId = body.houseId!!,
                date = body.date!!,
                topic = body.topic ?: "",
                type = body.type?.takeIf { it.isNotBlank() } ?: "therapeutic",
                time = body.time?.takeIf { it.isNotBlank() } ?: "",
                status = body.status?.takeIf { it.isNotBlank() } ?: "active",
                leaderId = body.leaderId,
                notes = body.notes,
                createdAt = now,
            )
        for (row in body.attendance.orEmpty()) {
            val pid = row.patientId ?: continue
            val ga =
                GroupAttendance(
                    id = GroupAttendanceId(g.id, pid),
                    status = row.status ?: "present",
                )
            ga.group = g
            ga.patient = patients.getReferenceById(pid)
            g.attendance.add(ga)
        }
        return ResponseEntity.status(201).body(groups.save(g))
    }

    data class PatchGroupBody(
        @field:Size(max = UiValidation.TOPIC_MAX)
        val topic: String? = null,
        @field:Size(max = UiValidation.NOTE_MAX)
        val notes: String? = null,
        @field:Size(max = UiValidation.ID_MAX)
        val leaderId: String? = null,
        @field:Size(max = UiValidation.SHORT_LABEL)
        val status: String? = null,
        @field:Valid
        @field:Size(max = 200)
        val attendance: List<PatchAttendanceRow>? = null,
    )

    @PatchMapping("/{id}")
    fun patch(
        @PathVariable @Size(min = 1, max = UiValidation.ID_MAX) id: String,
        @RequestBody @Valid body: PatchGroupBody,
    ): ResponseEntity<Any> {
        val g = groups.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        body.topic?.let { g.topic = it }
        body.notes?.let { g.notes = it }
        body.leaderId?.let { g.leaderId = it }
        body.status?.let { g.status = it }
        if (body.attendance != null) {
            val byPatient = g.attendance.associateBy { it.id.patientId }.toMutableMap()
            for (row in body.attendance) {
                val pid = row.patientId ?: continue
                val existing = byPatient[pid]
                if (existing != null) {
                    row.status?.let { existing.status = it }
                } else {
                    val ga =
                        GroupAttendance(
                            id = GroupAttendanceId(g.id, pid),
                            status = row.status ?: "present",
                        )
                    ga.group = g
                    ga.patient = patients.getReferenceById(pid)
                    g.attendance.add(ga)
                }
            }
        }
        return ResponseEntity.ok(groups.save(g))
    }

    data class PutAttendanceBody(
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val patientId: String? = null,
        @field:NotBlank @field:Pattern(regexp = "^(present|absent)$")
        val status: String? = null,
    )

    /** Legacy Express route: `PUT /api/groups/:id/attendance`. */
    @Transactional
    @PutMapping("/{groupId}/attendance")
    fun putAttendance(
        @PathVariable @Size(min = 1, max = UiValidation.ID_MAX) groupId: String,
        @RequestBody @Valid body: PutAttendanceBody,
    ): ResponseEntity<Any> {
        val g = groups.findById(groupId).orElse(null) ?: return ResponseEntity.notFound().build()
        val pid = body.patientId!!
        val st = body.status!!
        val existing = g.attendance.find { it.id.patientId == pid }
        if (existing != null) {
            existing.status = st
        } else {
            val ga = GroupAttendance(id = GroupAttendanceId(groupId, pid), status = st)
            ga.group = g
            ga.patient = patients.getReferenceById(pid)
            g.attendance.add(ga)
        }
        groups.save(g)
        return ResponseEntity.ok(
            mapOf(
                "id" to "${groupId}_$pid",
                "sessionId" to groupId,
                "patientId" to pid,
                "status" to st,
            ),
        )
    }
}
