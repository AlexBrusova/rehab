package com.rehabcenter.web

import com.rehabcenter.validation.FieldConstraints
import com.rehabcenter.validation.FieldRulesRegistry
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/field-rules")
class FieldRulesController {
    @GetMapping
    fun all(): Map<String, Map<String, FieldConstraints>> = FieldRulesRegistry.ALL
}
