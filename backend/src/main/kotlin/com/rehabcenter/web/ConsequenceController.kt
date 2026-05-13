package com.rehabcenter.web

import com.rehabcenter.domain.Consequence
import com.rehabcenter.repo.ConsequenceRepository
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
@RequestMapping("/api/consequences")
class ConsequenceController(
    private val consequences: ConsequenceRepository,
) {
    @GetMapping
    fun list(
        @RequestParam(required = false) @Size(min = 1, max = UiValidation.ID_MAX) houseId: String?,
    ): List<Consequence> =
        if (houseId.isNullOrBlank()) {
            consequences.findAllByOrderByCreatedAtDesc()
        } else {
            consequences.findByHouseIdOrderByCreatedAtDesc(houseId)
        }

    data class CreateConsequenceBody(
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val patientId: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val houseId: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.CONSEQUENCE_TYPE_MAX)
        val type: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.NOTE_MAX)
        val description: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.DATE_UI_MAX)
        val date: String? = null,
    )

    @PostMapping
    fun create(@RequestBody @Valid body: CreateConsequenceBody): ResponseEntity<Any> {
        val c =
            Consequence(
                id = UUID.randomUUID().toString(),
                patientId = body.patientId!!,
                houseId = body.houseId!!,
                type = body.type!!,
                description = body.description!!,
                date = body.date!!,
                status = "pending",
                createdAt = Instant.now(),
                updatedAt = Instant.now(),
            )
        return ResponseEntity.status(201).body(consequences.save(c))
    }

    data class PatchConsequenceBody(
        @field:Pattern(regexp = UiValidation.CONSEQUENCE_STATUS)
        val status: String? = null,
        @field:Size(max = UiValidation.NAME_MAX)
        val approvedBy: String? = null,
    )

    @PatchMapping("/{id}")
    fun patch(
        @PathVariable @Size(min = 1, max = UiValidation.ID_MAX) id: String,
        @RequestBody @Valid body: PatchConsequenceBody,
    ): ResponseEntity<Any> {
        val c = consequences.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        body.status?.let { c.status = it }
        body.approvedBy?.let { c.approvedBy = it }
        c.updatedAt = Instant.now()
        return ResponseEntity.ok(consequences.save(c))
    }
}
