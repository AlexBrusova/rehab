package com.rehabcenter.config

import io.github.resilience4j.circuitbreaker.CallNotPermittedException
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry
import org.aspectj.lang.ProceedingJoinPoint
import org.aspectj.lang.annotation.Around
import org.aspectj.lang.annotation.Aspect
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.server.ResponseStatusException

@Aspect
@Component
class DbCircuitBreakerAspect(registry: CircuitBreakerRegistry) {

    private val cb = registry.circuitBreaker("db")

    @Around("@within(org.springframework.web.bind.annotation.RestController)")
    fun protect(jp: ProceedingJoinPoint): Any? {
        return try {
            cb.executeCallable { jp.proceed() }
        } catch (ex: CallNotPermittedException) {
            throw ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Circuit breaker open — database temporarily unavailable",
            )
        }
    }
}
