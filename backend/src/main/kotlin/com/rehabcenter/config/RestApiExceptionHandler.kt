package com.rehabcenter.config

import com.rehabcenter.error.ApiBusinessException
import jakarta.persistence.EntityNotFoundException
import jakarta.persistence.OptimisticLockException
import jakarta.validation.ConstraintViolationException
import org.slf4j.LoggerFactory
import org.springframework.dao.DataAccessResourceFailureException
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.dao.EmptyResultDataAccessException
import org.springframework.dao.QueryTimeoutException
import org.springframework.dao.TransientDataAccessResourceException
import org.springframework.data.redis.RedisConnectionFailureException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.orm.ObjectOptimisticLockingFailureException
import org.springframework.orm.jpa.JpaObjectRetrievalFailureException
import org.springframework.security.access.AccessDeniedException
import org.springframework.transaction.TransactionTimedOutException
import org.springframework.web.HttpRequestMethodNotSupportedException
import org.springframework.web.bind.MissingServletRequestParameterException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.method.annotation.HandlerMethodValidationException
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException
import org.springframework.web.server.ResponseStatusException

/**
 * Централизованная обработка: бизнес-ошибки и соглашения по HTTP без «тихих» 500 в контроллерах.
 */
@RestControllerAdvice
class RestApiExceptionHandler {

    private val log = LoggerFactory.getLogger(javaClass)

    @ExceptionHandler(ApiBusinessException::class)
    fun businessRule(ex: ApiBusinessException): ResponseEntity<Map<String, Any?>> =
        ResponseEntity.status(ex.status).body(
            mapOf("error" to ex.message, "code" to ex.code),
        )

    @ExceptionHandler(ResponseStatusException::class)
    fun responseStatus(ex: ResponseStatusException): ResponseEntity<Map<String, Any?>> =
        ResponseEntity.status(ex.statusCode).body(
            mapOf("error" to (ex.reason ?: "Request failed")),
        )

    @ExceptionHandler(
        EntityNotFoundException::class,
        JpaObjectRetrievalFailureException::class,
        EmptyResultDataAccessException::class,
    )
    fun notFound(ex: Exception): ResponseEntity<Map<String, Any?>> {
        log.debug("Resource not found: {}", ex.message)
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            mapOf("error" to "Not found", "details" to (ex.message ?: "resource")),
        )
    }

    @ExceptionHandler(AccessDeniedException::class)
    fun forbidden(ex: AccessDeniedException): ResponseEntity<Map<String, Any?>> =
        ResponseEntity.status(HttpStatus.FORBIDDEN).body(
            mapOf("error" to "Forbidden", "details" to (ex.message ?: "insufficient privileges")),
        )

    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun badBody(ex: HttpMessageNotReadableException): ResponseEntity<Map<String, Any?>> =
        ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            mapOf("error" to "Malformed request body", "details" to (ex.mostSpecificCause.message ?: ex.message)),
        )

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun methodArgumentNotValid(ex: MethodArgumentNotValidException): ResponseEntity<Map<String, Any?>> {
        val fields =
            ex.bindingResult.fieldErrors.associate { fe ->
                fe.field to (fe.defaultMessage ?: "invalid")
            }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            mapOf("error" to "Validation failed", "fields" to fields),
        )
    }

    @ExceptionHandler(HandlerMethodValidationException::class)
    fun handlerMethodValidation(ex: HandlerMethodValidationException): ResponseEntity<Map<String, Any?>> =
        ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            mapOf("error" to "Validation failed", "details" to (ex.message ?: "invalid parameter")),
        )

    @ExceptionHandler(ConstraintViolationException::class)
    fun constraintViolation(ex: ConstraintViolationException): ResponseEntity<Map<String, Any?>> {
        val fields =
            ex.constraintViolations.associate { v ->
                v.propertyPath.toString() to (v.message ?: "invalid")
            }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            mapOf("error" to "Validation failed", "fields" to fields),
        )
    }

    @ExceptionHandler(
        MissingServletRequestParameterException::class,
        MethodArgumentTypeMismatchException::class,
    )
    fun badRequest(ex: Exception): ResponseEntity<Map<String, Any?>> =
        ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            mapOf("error" to "Bad request", "details" to (ex.message ?: "invalid")),
        )

    @ExceptionHandler(HttpRequestMethodNotSupportedException::class)
    fun methodNotAllowed(ex: HttpRequestMethodNotSupportedException): ResponseEntity<Map<String, Any?>> =
        ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(
            mapOf("error" to "Method not allowed", "details" to (ex.message ?: "")),
        )

    @ExceptionHandler(DataIntegrityViolationException::class)
    fun conflict(ex: DataIntegrityViolationException): ResponseEntity<Map<String, Any?>> {
        log.warn("Data integrity violation: {}", ex.mostSpecificCause.message)
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
            mapOf(
                "error" to "Conflict",
                "details" to "Operation violates data constraints (e.g. duplicate or foreign key)",
            ),
        )
    }

    @ExceptionHandler(
        ObjectOptimisticLockingFailureException::class,
        OptimisticLockException::class,
    )
    fun optimisticLock(ex: Exception): ResponseEntity<Map<String, Any?>> {
        log.warn("Optimistic lock: {}", ex.message)
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
            mapOf("error" to "Conflict", "details" to "Resource was modified concurrently"),
        )
    }

    @ExceptionHandler(RedisConnectionFailureException::class)
    fun redisUnavailable(ex: RedisConnectionFailureException): ResponseEntity<Map<String, Any?>> {
        log.warn("Redis unavailable: {}", ex.message)
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
            mapOf("error" to "Service temporarily unavailable", "details" to "Cache backend unavailable"),
        )
    }

    @ExceptionHandler(TransientDataAccessResourceException::class)
    fun transientDataAccess(ex: TransientDataAccessResourceException): ResponseEntity<Map<String, Any?>> {
        log.warn("Transient data access: {}", ex.message)
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
            mapOf("error" to "Service temporarily unavailable", "details" to "Transient storage failure"),
        )
    }

    @ExceptionHandler(
        DataAccessResourceFailureException::class,
        QueryTimeoutException::class,
        TransactionTimedOutException::class,
    )
    fun serviceUnavailable(ex: Exception): ResponseEntity<Map<String, Any?>> {
        log.error("Transient data access failure", ex)
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
            mapOf("error" to "Service temporarily unavailable", "details" to "Database or transaction timeout"),
        )
    }

    @ExceptionHandler(Exception::class)
    fun fallback(ex: Exception): ResponseEntity<Map<String, Any?>> {
        log.error("Unhandled exception", ex)
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            mapOf("error" to "Internal server error"),
        )
    }
}
