package com.rehabcenter.web

import com.rehabcenter.domain.CashboxCount
import com.rehabcenter.domain.CashboxEntry
import com.rehabcenter.repo.CashboxCountRepository
import com.rehabcenter.repo.CashboxEntryRepository
import com.rehabcenter.validation.UiValidation
import com.fasterxml.jackson.annotation.JsonProperty
import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.springframework.http.ResponseEntity
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
class FinanceCashboxProxyController(
    private val entries: CashboxEntryRepository,
    private val counts: CashboxCountRepository,
) {
    @GetMapping("/cashbox")
    fun listCashbox(
        @RequestParam @NotBlank @Size(max = UiValidation.ID_MAX) houseId: String,
    ): ResponseEntity<Any> =
        ResponseEntity.ok(entries.findByHouseIdOrderByCreatedAtDesc(houseId))

    data class CreateCashboxEntryBody(
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val houseId: String? = null,
        @field:NotBlank @field:Pattern(regexp = UiValidation.FINANCE_TYPE)
        val type: String? = null,
        @field:Min(-1_000_000_000)
        @field:Max(1_000_000_000)
        val amount: Int? = null,
        @field:Size(max = UiValidation.SHORT_LABEL)
        val cat: String? = null,
        @field:Size(max = UiValidation.NOTE_MAX)
        val note: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.DATE_UI_MAX)
        val date: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.TIME_HHMM_MAX)
        @field:Pattern(regexp = UiValidation.TIME_HHMM_PATTERN)
        val time: String? = null,
        @param:JsonProperty("by")
        @field:NotBlank
        @field:Size(max = UiValidation.NAME_MAX)
        val byStaff: String? = null,
        @field:Min(-1_000_000_000)
        @field:Max(1_000_000_000)
        val balance: Int? = null,
    )

    @PostMapping("/cashbox")
    fun createCashboxEntry(@RequestBody @Valid body: CreateCashboxEntryBody): ResponseEntity<Any> {
        val e =
            CashboxEntry(
                id = UUID.randomUUID().toString(),
                houseId = body.houseId!!,
                type = body.type!!,
                amount = body.amount!!,
                cat = body.cat ?: "",
                note = body.note ?: "",
                date = body.date!!,
                time = body.time!!,
                byStaff = body.byStaff!!,
                balance = body.balance!!,
                createdAt = Instant.now(),
            )
        return ResponseEntity.status(201).body(entries.save(e))
    }

    @GetMapping("/cashbox-counts")
    fun listCashboxCounts(
        @RequestParam @NotBlank @Size(max = UiValidation.ID_MAX) houseId: String,
    ): ResponseEntity<Any> =
        ResponseEntity.ok(counts.findByHouseIdOrderByCreatedAtDesc(houseId))

    data class CreateCashboxCountBody(
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val houseId: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.NAME_MAX)
        val countedBy: String? = null,
        @field:Min(-1_000_000_000)
        @field:Max(1_000_000_000)
        val amount: Int? = null,
        @field:Min(-1_000_000_000)
        @field:Max(1_000_000_000)
        val expected: Int? = null,
        @field:Min(-1_000_000_000)
        @field:Max(1_000_000_000)
        val diff: Int? = null,
        @field:NotBlank @field:Size(max = UiValidation.DATE_UI_MAX)
        val date: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.TIME_HHMM_MAX)
        @field:Pattern(regexp = UiValidation.TIME_HHMM_PATTERN)
        val time: String? = null,
        @field:Size(max = UiValidation.NOTE_MAX)
        val notes: String? = null,
    )

    @PostMapping("/cashbox-counts")
    fun createCashboxCount(@RequestBody @Valid body: CreateCashboxCountBody): ResponseEntity<Any> {
        val c =
            CashboxCount(
                id = UUID.randomUUID().toString(),
                houseId = body.houseId!!,
                countedBy = body.countedBy!!,
                amount = body.amount!!,
                expected = body.expected!!,
                diff = body.diff!!,
                date = body.date!!,
                time = body.time!!,
                notes = body.notes,
                createdAt = Instant.now(),
            )
        return ResponseEntity.status(201).body(counts.save(c))
    }
}
