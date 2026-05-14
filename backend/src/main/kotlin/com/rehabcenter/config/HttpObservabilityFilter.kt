package com.rehabcenter.config

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.slf4j.MDC
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.util.UUID

/**
 * Встроенный слой наблюдаемости для каждого HTTP-запроса (без кода в контроллерах):
 * — заголовок [X-Request-Id] и MDC `requestId` для логов;
 * — одна строка access-лога (метод, URI, статус, длительность).
 * Метрики Micrometer по HTTP остаются на стандартной автоконфигурации Spring Boot.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class HttpObservabilityFilter : OncePerRequestFilter() {

    private val accessLog = LoggerFactory.getLogger("com.rehabcenter.http.access")

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val incoming = request.getHeader(REQUEST_ID_HEADER)?.trim()?.takeIf { it.isNotEmpty() }
        val requestId = incoming ?: UUID.randomUUID().toString()
        response.setHeader(REQUEST_ID_HEADER, requestId)
        MDC.put(MDC_REQUEST_ID, requestId)

        val startNs = System.nanoTime()
        try {
            filterChain.doFilter(request, response)
        } finally {
            val durationMs = (System.nanoTime() - startNs) / 1_000_000L
            val uri = request.requestURI
            if (!uri.startsWith("/actuator/")) {
                accessLog.info("{} {} -> {} ({} ms)", request.method, uri, response.status, durationMs)
            }
            MDC.remove(MDC_REQUEST_ID)
        }
    }

    companion object {
        const val REQUEST_ID_HEADER = "X-Request-Id"
        const val MDC_REQUEST_ID = "requestId"
    }
}
