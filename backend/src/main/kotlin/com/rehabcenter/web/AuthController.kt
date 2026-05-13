package com.rehabcenter.web

import com.rehabcenter.repo.UserRepository
import com.rehabcenter.security.JwtService
import com.rehabcenter.validation.UiValidation
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.http.ResponseEntity
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

data class LoginRequest(
    @field:NotBlank @field:Size(max = UiValidation.USERNAME_MAX)
    val username: String? = null,
    @field:NotBlank @field:Size(max = UiValidation.PASSWORD_MAX)
    val password: String? = null,
)

@Validated
@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val users: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtService: JwtService,
) {
    @PostMapping("/login")
    fun login(@RequestBody @Valid body: LoginRequest): ResponseEntity<Any> {
        val username = body.username!!.trim()
        val password = body.password!!
        val user = users.findDetailsByUsername(username)
            ?: return ResponseEntity.status(401).body(mapOf("error" to "Invalid credentials"))
        if (!passwordEncoder.matches(password, user.passwordHash)) {
            return ResponseEntity.status(401).body(mapOf("error" to "Invalid credentials"))
        }
        val token = jwtService.createToken(user.id, user.role)
        return ResponseEntity.ok(mapOf("token" to token, "user" to user))
    }
}
