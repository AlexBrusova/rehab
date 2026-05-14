package com.rehabcenter.web

import com.rehabcenter.domain.ShiftDist
import com.rehabcenter.repo.ShiftDistRepository
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

@Validated
@RestController
@RequestMapping("/api/distributions")
class ShiftDistributionController(
    private val shiftDist: ShiftDistRepository,
) {
    @GetMapping
    fun list(
        @RequestParam @NotBlank @Size(max = UiValidation.ID_MAX) houseId: String,
        @RequestParam @NotBlank @Size(max = UiValidation.DATE_UI_MAX) date: String,
    ): ResponseEntity<Any> =
        ResponseEntity.ok(shiftDist.findByHouseIdAndDate(houseId, date))

    data class UpsertBody(
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val patientId: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.SHIFT_TYPE_MAX)
        val shift: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.DATE_UI_MAX)
        val date: String? = null,
        @field:Size(max = UiValidation.SHIFT_TYPE_MAX)
        val status: String? = null,
    )

    @PutMapping
    @Transactional
    fun upsert(@RequestBody @Valid body: UpsertBody): ResponseEntity<Any> {
        val row =
            ShiftDist(
                patientId = body.patientId!!,
                shift = body.shift!!,
                date = body.date!!,
                status = body.status,
            )
        return ResponseEntity.ok(shiftDist.save(row))
    }
}
