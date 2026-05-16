package com.rehabcenter.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.core.env.Environment
import org.springframework.core.env.Profiles
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class JwtAuthenticationFilter(
    private val jwtService: JwtService,
    private val environment: Environment,
) : OncePerRequestFilter() {

    private val log = LoggerFactory.getLogger(javaClass)

    override fun shouldNotFilter(request: HttpServletRequest): Boolean {
        val path = request.requestURI
        if (path == "/health" || path == "/api/auth/login" || path.startsWith("/error")) return true
        if (path == "/api/field-rules") return true
        if (path.startsWith("/actuator/health")) return true
        if (path == "/actuator/info") return true
        if (environment.acceptsProfiles(Profiles.of("docker")) && path == "/actuator/prometheus") return true
        return false
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val header = request.getHeader("Authorization")
        val token = header?.removePrefix("Bearer ")?.trim()
        if (token.isNullOrBlank()) {
            writeJson(response, HttpServletResponse.SC_UNAUTHORIZED, """{"error":"No token"}""")
            return
        }
        try {
            val claims = jwtService.parseClaims(token)
            val userId = claims["userId"] as? String ?: error("missing userId")
            val role = claims["role"] as? String ?: "counselor"
            val auth = UsernamePasswordAuthenticationToken(
                userId,
                null,
                listOf(SimpleGrantedAuthority("ROLE_$role")),
            )
            SecurityContextHolder.getContext().authentication = auth
            filterChain.doFilter(request, response)
        } catch (ex: Exception) {
            log.debug("JWT rejected: {}", ex.message)
            writeJson(response, HttpServletResponse.SC_UNAUTHORIZED, """{"error":"Invalid token"}""")
        }
    }

    private fun writeJson(response: HttpServletResponse, status: Int, body: String) {
        response.status = status
        response.characterEncoding = Charsets.UTF_8.name()
        response.contentType = "application/json;charset=UTF-8"
        response.writer.write(body)
    }
}
