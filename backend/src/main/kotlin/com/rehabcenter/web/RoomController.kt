package com.rehabcenter.web

import com.rehabcenter.domain.Room
import com.rehabcenter.error.ApiBusinessException
import com.rehabcenter.repo.PatientRepository
import com.rehabcenter.repo.RoomRepository
import com.rehabcenter.validation.UiValidation
import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.DeleteMapping
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
@RequestMapping("/api/rooms")
class RoomController(
    private val rooms: RoomRepository,
    private val patients: PatientRepository,
) {
    @GetMapping
    fun list(
        @RequestParam(required = false) @Size(min = 1, max = UiValidation.ID_MAX) houseId: String?,
    ): List<Room> =
        if (houseId.isNullOrBlank()) {
            rooms.findAllByOrderByBuildingAscNumberAsc()
        } else {
            rooms.findByHouseIdOrderByBuildingAscNumberAsc(houseId)
        }

    data class CreateRoomBody(
        @field:NotBlank @field:Size(max = UiValidation.ROOM_NUMBER_MAX)
        val number: String? = null,
        @field:NotBlank @field:Size(max = UiValidation.ROOM_BUILDING_MAX)
        val building: String? = null,
        @field:Min(UiValidation.ROOM_CAPACITY_MIN.toLong()) @field:Max(UiValidation.ROOM_CAPACITY_MAX.toLong())
        val capacity: Int? = null,
        @field:NotBlank @field:Size(max = UiValidation.ID_MAX)
        val houseId: String? = null,
    )

    @PostMapping
    fun create(@RequestBody @Valid body: CreateRoomBody): ResponseEntity<Any> {
        val r =
            Room(
                id = UUID.randomUUID().toString(),
                number = body.number!!,
                building = body.building!!,
                capacity = body.capacity ?: 2,
                houseId = body.houseId!!,
                createdAt = Instant.now(),
            )
        return ResponseEntity.status(201).body(rooms.save(r))
    }

    data class PatchRoomBody(
        @field:Size(min = 1, max = UiValidation.ROOM_NUMBER_MAX)
        val number: String? = null,
        @field:Size(min = 1, max = UiValidation.ROOM_BUILDING_MAX)
        val building: String? = null,
        @field:Min(UiValidation.ROOM_CAPACITY_MIN.toLong()) @field:Max(UiValidation.ROOM_CAPACITY_MAX.toLong())
        val capacity: Int? = null,
    )

    @PatchMapping("/{id}")
    fun patch(
        @PathVariable @Size(min = 1, max = UiValidation.ID_MAX) id: String,
        @RequestBody @Valid body: PatchRoomBody,
    ): ResponseEntity<Any> {
        val r = rooms.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        body.number?.let { r.number = it }
        body.building?.let { r.building = it }
        body.capacity?.let { r.capacity = it }
        return ResponseEntity.ok(rooms.save(r))
    }

    @DeleteMapping("/{id}")
    fun delete(
        @PathVariable @Size(min = 1, max = UiValidation.ID_MAX) id: String,
    ): ResponseEntity<Any> {
        if (patients.existsByRoomId(id)) {
            throw ApiBusinessException(
                HttpStatus.BAD_REQUEST,
                "Room has assigned patients",
                "room_in_use",
            )
        }
        rooms.deleteById(id)
        return ResponseEntity.ok(mapOf("ok" to true))
    }
}
