package com.rehabcenter.web

import com.rehabcenter.domain.CounselorSchedule
import com.rehabcenter.repo.CounselorScheduleRepository
import com.rehabcenter.validation.UiValidation
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
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
@RequestMapping("/api/schedule")
class ScheduleController(
    private val schedules: CounselorScheduleRepository,
) {
    @GetMapping
    fun list(
        @RequestParam @NotBlank @Size(max = UiValidation.ID_MAX) houseId: String,
    ): ResponseEntity<Any> =
        ResponseEntity.ok(schedules.findByHouseIdOrderByDateAscCounselorIdAsc(houseId))

    data class CreateScheduleBody(
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val houseId: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val counselorId: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.DATE_UI_MAX)
        val date: String? = null,
        @field:Size(max = UiValidation.SCHEDULE_SHIFT_TYPE_MAX)
        val shiftType: String? = null,
        @field:Size(max = UiValidation.NOTE_MAX)
        val note: String? = null,
    )

    @Transactional
    @PostMapping
    fun create(@RequestBody @Valid body: CreateScheduleBody): ResponseEntity<Any> {
        val s =
            CounselorSchedule(
                id = UUID.randomUUID().toString(),
                houseId = body.houseId!!,
                counselorId = body.counselorId!!,
                date = body.date!!,
                shiftType = body.shiftType?.takeIf { it.isNotBlank() } ?: "24h",
                note = body.note,
                createdAt = Instant.now(),
            )
        return ResponseEntity.status(201).body(schedules.save(s))
    }

    @Transactional
    @DeleteMapping("/{id}")
    fun delete(
        @PathVariable @Size(min = 1, max = UiValidation.ID_MAX) id: String,
    ): ResponseEntity<Any> {
        if (!schedules.existsById(id)) return ResponseEntity.notFound().build()
        schedules.deleteById(id)
        return ResponseEntity.ok(mapOf("ok" to true))
    }

    data class AssignScheduleBody(
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val houseId: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.DATE_UI_MAX)
        val date: String? = null,
        @field:Size(max = UiValidation.ID_MAX)
        val counselorId: String? = null,
        @field:Size(max = UiValidation.NOTE_MAX)
        val note: String? = null,
    )

    /** Legacy Express `PUT /api/schedule/assign`. */
    @PutMapping("/assign")
    @Transactional
    fun assign(
        @RequestBody @Valid body: AssignScheduleBody,
    ): ResponseEntity<Any> {
        schedules.deleteByHouseIdAndDate(body.houseId!!, body.date!!)
        val cid = body.counselorId
        if (cid.isNullOrBlank()) {
            return ResponseEntity.ok(null)
        }
        val s =
            CounselorSchedule(
                id = UUID.randomUUID().toString(),
                houseId = body.houseId!!,
                counselorId = cid,
                date = body.date!!,
                shiftType = "24h",
                note = body.note,
                createdAt = Instant.now(),
            )
        return ResponseEntity.ok(schedules.save(s))
    }
}
