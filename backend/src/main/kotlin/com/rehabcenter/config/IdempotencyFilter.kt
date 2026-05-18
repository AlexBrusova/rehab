package com.rehabcenter.config

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.annotation.Order
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import org.springframework.web.util.ContentCachingResponseWrapper
import java.time.Duration

@Component
@Order(3)
class IdempotencyFilter : OncePerRequestFilter() {

    @Autowired(required = false)
    private var redisTemplate: StringRedisTemplate? = null

    private val log = LoggerFactory.getLogger(javaClass)

    companion object {
        private val IDEMPOTENT_PATHS = setOf(
            "/api/patients",
            "/api/finance/cashbox",
        )
        private val TTL = Duration.ofDays(1)
        private const val PREFIX = "idempotency:"
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        chain: FilterChain,
    ) {
        val key = request.getHeader("X-Idempotency-Key")
        val isIdempotentPath = IDEMPOTENT_PATHS.any { request.requestURI.startsWith(it) }

        if (key.isNullOrBlank() || !isIdempotentPath || request.method != "POST") {
            chain.doFilter(request, response)
            return
        }

        val template = redisTemplate
        if (template == null) {
            log.debug("Idempotency Redis not configured, bypassing")
            chain.doFilter(request, response)
            return
        }

        val redisKey = "$PREFIX$key"

        try {
            val cached = template.opsForValue().get(redisKey)

            if (cached == "pending") {
                response.status = 409
                response.contentType = "application/json;charset=UTF-8"
                response.writer.write("""{"error":"Conflict","details":"Duplicate request in flight — retry later"}""")
                return
            }

            if (cached != null) {
                // Replay cached response — stored as "status\nbody"
                val newline = cached.indexOf('\n')
                val cachedStatus = if (newline > 0) cached.substring(0, newline).toIntOrNull() ?: 200 else 200
                val cachedBody = if (newline > 0) cached.substring(newline + 1) else cached
                response.status = cachedStatus
                response.contentType = "application/json;charset=UTF-8"
                response.writer.write(cachedBody)
                return
            }

            // Mark as pending before executing
            template.opsForValue().set(redisKey, "pending", TTL)

            val wrapper = ContentCachingResponseWrapper(response)
            chain.doFilter(request, wrapper)

            val responseBody = String(wrapper.contentAsByteArray, Charsets.UTF_8)
            if (wrapper.status in 200..299 && responseBody.isNotBlank()) {
                template.opsForValue().set(redisKey, "${wrapper.status}\n$responseBody", TTL)
            } else {
                // Request failed — remove pending marker so client can retry
                template.delete(redisKey)
            }
            wrapper.copyBodyToResponse()
        } catch (ex: Exception) {
            log.warn("Idempotency Redis unavailable, bypassing: {}", ex.message)
            chain.doFilter(request, response)
        }
    }
}
