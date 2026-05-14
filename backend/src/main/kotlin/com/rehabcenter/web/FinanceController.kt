package com.rehabcenter.web

import com.fasterxml.jackson.annotation.JsonAlias
import com.rehabcenter.domain.Finance
import com.rehabcenter.repo.FinanceRepository
import com.rehabcenter.validation.UiValidation
import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
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
import java.util.UUID

@Validated
@RestController
@RequestMapping("/api/finance")
class FinanceController(
    private val finances: FinanceRepository,
) {
    @GetMapping("/patient")
    fun listPatientFinanceByHouse(
        @RequestParam @NotBlank @Size(max = UiValidation.ID_MAX) houseId: String,
    ): ResponseEntity<Any> =
        ResponseEntity.ok(finances.findByHouseIdOrderByCreatedAtDesc(houseId))

    @Transactional
    @PostMapping("/patient")
    fun createPatientFinanceEntry(@RequestBody @Valid body: CreateFinanceBody): ResponseEntity<Any> =
        persist(body)

    @GetMapping
    fun list(
        @RequestParam @NotBlank @Size(max = UiValidation.ID_MAX) patientId: String,
    ): ResponseEntity<Any> =
        ResponseEntity.ok(finances.findByPatientIdOrderByDateDescCreatedAtDesc(patientId))

    data class CreateFinanceBody(
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val patientId: String? = null,
        @field:NotBlank @field:Pattern(regexp = UiValidation.FINANCE_TYPE)
        val type: String? = null,
        @field:Min(-1_000_000_000)
        @field:Max(1_000_000_000)
        val amount: Int? = null,
        @field:JsonAlias("cat")
        @field:Size(max = UiValidation.SHORT_LABEL)
        val source: String? = null,
        @field:Size(max = UiValidation.NOTE_MAX)
        val note: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.DATE_UI_MAX)
        val date: String? = null,
        @field:Min(-1_000_000_000)
        @field:Max(1_000_000_000)
        val balance: Int? = null,
    )

    @Transactional
    @PostMapping
    fun create(@RequestBody @Valid body: CreateFinanceBody): ResponseEntity<Any> = persist(body)

    private fun persist(body: CreateFinanceBody): ResponseEntity<Any> {
        val f =
            Finance(
                id = UUID.randomUUID().toString(),
                patientId = body.patientId!!,
                type = body.type!!,
                amount = body.amount!!,
                source = body.source ?: "",
                note = body.note ?: "",
                date = body.date!!,
                balance = body.balance!!,
                createdAt = Instant.now(),
            )
        return ResponseEntity.status(201).body(finances.save(f))
    }
}
