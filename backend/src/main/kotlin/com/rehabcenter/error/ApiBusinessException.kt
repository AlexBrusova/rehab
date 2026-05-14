package com.rehabcenter.error

import org.springframework.http.HttpStatus

/**
 * Ожидаемое нарушение бизнес-правила: не 500, а заданный HTTP-статус и понятное сообщение для клиента.
 */
class ApiBusinessException(
    val status: HttpStatus,
    message: String,
    val code: String = "business_rule",
) : RuntimeException(message)
