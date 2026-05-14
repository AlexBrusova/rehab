package com.rehabcenter.config

import jakarta.validation.ConstraintViolationException
import org.springframework.context.support.DefaultMessageSourceResolvable
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.validation.FieldError
import org.springframework.validation.method.ParameterValidationResult
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.method.annotation.HandlerMethodValidationException

@RestControllerAdvice
class ValidationExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleMethodArgumentNotValid(ex: MethodArgumentNotValidException): ResponseEntity<Map<String, Any?>> {
        val details =
            ex.bindingResult.allErrors.associate { err ->
                val field = (err as? FieldError)?.field ?: err.objectName
                field to (err.defaultMessage ?: "invalid")
            }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            mapOf(
                "error" to "Validation failed",
                "details" to details,
            ),
        )
    }

    @ExceptionHandler(HandlerMethodValidationException::class)
    fun handleHandlerMethodValidation(ex: HandlerMethodValidationException): ResponseEntity<Map<String, Any?>> {
        val results: List<ParameterValidationResult> = ex.allValidationResults
        val messages =
            results.flatMap { result ->
                @Suppress("UNCHECKED_CAST")
                val errs = result.resolvableErrors as List<Any>
                errs.map { err ->
                    when (err) {
                        is FieldError -> err.defaultMessage ?: "invalid"
                        is DefaultMessageSourceResolvable -> err.defaultMessage ?: err.toString()
                        else -> err.toString()
                    }
                }
            }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            mapOf(
                "error" to "Validation failed",
                "details" to messages,
            ),
        )
    }

    @ExceptionHandler(ConstraintViolationException::class)
    fun handleConstraintViolation(ex: ConstraintViolationException): ResponseEntity<Map<String, Any?>> {
        val details =
            ex.constraintViolations.associate { v ->
                v.propertyPath.toString() to (v.message ?: "invalid")
            }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            mapOf(
                "error" to "Validation failed",
                "details" to details,
            ),
        )
    }
}
