package com.rehabcenter.web

import com.rehabcenter.domain.TherapistAssignment
import com.rehabcenter.repo.TherapistAssignmentRepository
import com.rehabcenter.validation.UiValidation
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

/** Legacy Express `/api/therapist-assignments` (map + PUT upsert/delete). */
@Validated
@RestController
@RequestMapping("/api/therapist-assignments")
class TherapistAssignmentCompatController(
    private val assignments: TherapistAssignmentRepository,
) {
    @GetMapping
    fun listAsMap(
        @RequestParam @NotBlank @Size(max = UiValidation.ID_MAX) houseId: String,
    ): ResponseEntity<Map<String, String>> {
        val rows = assignments.findByPatientHouseId(houseId)
        val map = LinkedHashMap<String, String>()
        for (r in rows) {
            map[r.patientId] = r.therapistId
        }
        return ResponseEntity.ok(map)
    }

    data class PutBody(
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val patientId: String? = null,
        @field:Size(max = UiValidation.ID_MAX)
        val therapistId: String? = null,
    )

    @PutMapping
    @Transactional
    fun upsertOrDelete(@RequestBody @Valid body: PutBody): ResponseEntity<Any> {
        val pid = body.patientId!!
        val tid = body.therapistId
        if (tid.isNullOrBlank()) {
            assignments.deleteById(pid)
            return ResponseEntity.ok(mapOf("patientId" to pid, "therapistId" to null))
        }
        val entity =
            assignments.findById(pid).orElseGet { TherapistAssignment(patientId = pid, therapistId = tid) }
                .apply { therapistId = tid }
        val saved = assignments.save(entity)
        return ResponseEntity.ok(mapOf("patientId" to saved.patientId, "therapistId" to saved.therapistId))
    }
}
