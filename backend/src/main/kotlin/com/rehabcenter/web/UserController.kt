package com.rehabcenter.web

import com.rehabcenter.domain.AppUser
import com.rehabcenter.repo.UserRepository
import com.rehabcenter.validation.UiValidation
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.springframework.http.ResponseEntity
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.util.UUID

data class CreateUserRequest(
    @field:NotBlank @field:Size(max = UiValidation.NAME_MAX)
    val name: String? = null,
    @field:NotBlank @field:Size(max = UiValidation.USERNAME_MAX)
    val username: String? = null,
    @field:NotBlank @field:Pattern(regexp = UiValidation.ROLE)
    val role: String? = null,
    @field:NotBlank @field:Size(max = UiValidation.SHORT_LABEL)
    val roleLabel: String? = null,
    @field:Size(max = 8)
    val initials: String? = null,
    @field:Pattern(regexp = UiValidation.HEX_COLOR)
    val color: String? = null,
    @field:Size(max = 64)
    val phone: String? = null,
    val allHousesAccess: Boolean? = null,
    @field:Size(max = UiValidation.ID_MAX)
    val houseId: String? = null,
    @field:Size(max = UiValidation.PASSWORD_MAX)
    val password: String? = null,
)

data class PatchUserRequest(
    @field:Size(max = UiValidation.NAME_MAX)
    val name: String? = null,
    @field:Size(max = UiValidation.USERNAME_MAX)
    val username: String? = null,
    @field:Pattern(regexp = UiValidation.ROLE)
    val role: String? = null,
    @field:Size(max = UiValidation.SHORT_LABEL)
    val roleLabel: String? = null,
    @field:Size(max = 8)
    val initials: String? = null,
    @field:Pattern(regexp = UiValidation.HEX_COLOR)
    val color: String? = null,
    @field:Size(max = 64)
    val phone: String? = null,
    val allHousesAccess: Boolean? = null,
    @field:Size(max = UiValidation.ID_MAX)
    val houseId: String? = null,
    @field:Size(min = 1, max = UiValidation.PASSWORD_MAX)
    val password: String? = null,
)

@Validated
@RestController
@RequestMapping("/api/users")
class UserController(
    private val users: UserRepository,
    private val passwordEncoder: PasswordEncoder,
) {
    @GetMapping
    fun list() = users.findAllByOrderByNameAsc()

    @PostMapping
    fun create(@RequestBody @Valid body: CreateUserRequest): ResponseEntity<Any> {
        val now = Instant.now()
        val hash = passwordEncoder.encode(body.password ?: "1234")
        val initialsFromName =
            body.name!!
                .trim()
                .split(Regex("\\s+"))
                .mapNotNull { word -> word.firstOrNull()?.uppercaseChar()?.toString() }
                .joinToString("")
                .take(8)
                .ifEmpty { "?" }
        val initials =
            body.initials?.trim()?.take(8)?.takeIf { it.isNotEmpty() } ?: initialsFromName
        val u =
            AppUser(
                id = UUID.randomUUID().toString(),
                username = body.username!!,
                passwordHash = hash,
                name = body.name!!,
                role = body.role!!,
                roleLabel = body.roleLabel!!,
                initials = initials,
                color = body.color ?: "#1e5fa8",
                phone = body.phone,
                allHousesAccess = body.allHousesAccess ?: false,
                houseId = body.houseId,
                createdAt = now,
                updatedAt = now,
            )
        return ResponseEntity.status(201).body(users.save(u))
    }

    @PatchMapping("/{id}")
    fun patch(
        @PathVariable @Size(min = 1, max = UiValidation.ID_MAX) id: String,
        @RequestBody @Valid body: PatchUserRequest,
    ): ResponseEntity<Any> {
        val u = users.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        body.name?.let { u.name = it }
        body.username?.let { u.username = it }
        body.role?.let { u.role = it }
        body.roleLabel?.let { u.roleLabel = it }
        body.initials?.let { u.initials = it }
        body.color?.let { u.color = it }
        body.phone?.let { u.phone = it }
        body.allHousesAccess?.let { u.allHousesAccess = it }
        body.houseId?.let { u.houseId = it }
        body.password?.takeIf { it.isNotEmpty() }?.let {
            u.passwordHash = passwordEncoder.encode(it)
        }
        u.updatedAt = Instant.now()
        return ResponseEntity.ok(users.save(u))
    }
}
