package com.rehabcenter.web

import com.rehabcenter.domain.Phone
import com.rehabcenter.repo.PhoneRepository
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
import java.util.UUID

@Validated
@RestController
@RequestMapping("/api/phones")
class PhoneController(
    private val phones: PhoneRepository,
) {
    @GetMapping
    fun list(
        @RequestParam(required = false) @Size(min = 1, max = UiValidation.ID_MAX) houseId: String?,
    ): List<Phone> =
        if (houseId.isNullOrBlank()) {
            phones.findAllForPhones()
        } else {
            phones.findByPatientHouseId(houseId)
        }

    data class CreatePhoneBody(
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val patientId: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.TIME_HHMM_MAX)
        @field:Pattern(regexp = UiValidation.TIME_HHMM_PATTERN)
        val givenAt: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.TIME_HHMM_MAX)
        @field:Pattern(regexp = UiValidation.TIME_HHMM_PATTERN)
        val returnBy: String? = null,
    )

    @PostMapping
    fun create(@RequestBody @Valid body: CreatePhoneBody): ResponseEntity<Any> {
        val p =
            Phone(
                id = UUID.randomUUID().toString(),
                patientId = body.patientId!!,
                givenAt = body.givenAt!!,
                returnBy = body.returnBy!!,
                status = "active",
                createdAt = Instant.now(),
            )
        return ResponseEntity.status(201).body(phones.save(p))
    }

    data class PatchPhoneBody(
        @field:Pattern(regexp = UiValidation.PHONE_STATUS)
        val status: String? = null,
        @field:Size(max = UiValidation.TIME_HHMM_MAX)
        @field:Pattern(regexp = UiValidation.TIME_HHMM_PATTERN)
        val returnedAt: String? = null,
        val late: Boolean? = null,
    )

    @PatchMapping("/{id}")
    fun patch(
        @PathVariable @Size(min = 1, max = UiValidation.ID_MAX) id: String,
        @RequestBody @Valid body: PatchPhoneBody,
    ): ResponseEntity<Any> {
        val p = phones.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        body.status?.let { p.status = it }
        body.returnedAt?.let { p.returnedAt = it }
        body.late?.let { p.late = it }
        return ResponseEntity.ok(phones.save(p))
    }
}
