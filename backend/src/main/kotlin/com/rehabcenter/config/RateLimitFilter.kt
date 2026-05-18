package com.rehabcenter.config

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.annotation.Order
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.data.redis.core.script.RedisScript
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
@Order(2)
class RateLimitFilter : OncePerRequestFilter() {

    @Autowired(required = false)
    private var redisTemplate: StringRedisTemplate? = null

    private val log = LoggerFactory.getLogger(javaClass)

    companion object {
        private val INCREMENT_SCRIPT: RedisScript<Long> = RedisScript.of(
            """
            local count = redis.call('INCR', KEYS[1])
            if count == 1 then
                redis.call('EXPIRE', KEYS[1], ARGV[1])
            end
            return count
            """.trimIndent(),
            Long::class.java,
        )

        private data class Limit(val requests: Long, val windowSeconds: Long)

        private val AUTH_LIMIT = Limit(30, 60)
        private val WRITE_LIMIT = Limit(100, 60)
        private val READ_LIMIT = Limit(300, 60)
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        chain: FilterChain,
    ) {
        val (category, limit) = resolveLimit(request)
        val principal = resolvePrincipal(request)
        val key = "rl:$category:$principal"

        val template = redisTemplate
        if (template == null) {
            log.debug("Rate limit Redis not configured, bypassing")
            chain.doFilter(request, response)
            return
        }

        val count = try {
            template.execute(INCREMENT_SCRIPT, listOf(key), limit.windowSeconds.toString()) ?: 0L
        } catch (ex: Exception) {
            log.warn("Rate limit Redis unavailable, bypassing: {}", ex.message)
            chain.doFilter(request, response)
            return
        }

        if (count > limit.requests) {
            response.status = 429
            response.setHeader("Retry-After", limit.windowSeconds.toString())
            response.contentType = "application/json;charset=UTF-8"
            response.writer.write(
                """{"error":"Too many requests","details":"Rate limit exceeded. Retry after ${limit.windowSeconds}s"}""",
            )
            return
        }

        chain.doFilter(request, response)
    }

    private fun resolveLimit(request: HttpServletRequest): Pair<String, Limit> {
        val path = request.requestURI
        val method = request.method.uppercase()

        if (path.startsWith("/api/auth/")) return "auth" to AUTH_LIMIT
        if (method in setOf("POST", "PUT", "PATCH", "DELETE")) return "write" to WRITE_LIMIT
        return "read" to READ_LIMIT
    }

    private fun resolvePrincipal(request: HttpServletRequest): String {
        return try {
            SecurityContextHolder.getContext().authentication?.name?.takeIf { it.isNotBlank() }
                ?: request.remoteAddr
        } catch (_: Exception) {
            request.remoteAddr
        }
    }
}
