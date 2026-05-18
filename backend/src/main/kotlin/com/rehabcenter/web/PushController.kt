package com.rehabcenter.web

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.rehabcenter.domain.PushSubscription
import com.rehabcenter.repo.PushSubscriptionRepository
import com.rehabcenter.service.PushSender
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.transaction.annotation.Transactional
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@Validated
@RestController
@RequestMapping("/api/push")
class PushController(
    private val subscriptions: PushSubscriptionRepository,
    private val push: PushSender,
) {
    @GetMapping("/public-key")
    fun publicKey(): ResponseEntity<Map<String, String>> {
        val key = push.vapidPublicKeyBase64()
        if (key.isBlank()) return ResponseEntity.status(503).body(mapOf("error" to "Push not configured"))
        return ResponseEntity.ok(mapOf("publicKey" to key))
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    data class SubscribeBody(
        @field:NotBlank @field:Size(max = 2048) val endpoint: String? = null,
        @field:NotBlank @field:Size(max = 512)  val p256dh: String? = null,
        @field:NotBlank @field:Size(max = 128)  val auth: String? = null,
        @field:Size(max = 36)                   val houseId: String? = null,
    )

    @Transactional
    @PostMapping("/subscribe")
    fun subscribe(@RequestBody @Valid body: SubscribeBody): ResponseEntity<Any> {
        val userId = SecurityContextHolder.getContext().authentication.name
        val existing = subscriptions.findByEndpoint(body.endpoint!!)
        if (existing != null) {
            existing.userId = userId
            existing.houseId = body.houseId
            existing.p256dh = body.p256dh!!
            existing.auth = body.auth!!
            return ResponseEntity.ok(subscriptions.save(existing))
        }
        val sub = PushSubscription(
            id = UUID.randomUUID().toString(),
            userId = userId,
            houseId = body.houseId,
            endpoint = body.endpoint,
            p256dh = body.p256dh!!,
            auth = body.auth!!,
        )
        return ResponseEntity.status(201).body(subscriptions.save(sub))
    }

    @Transactional
    @DeleteMapping("/subscribe")
    fun unsubscribe(
        @RequestParam @NotBlank @Size(max = 2048) endpoint: String,
    ): ResponseEntity<Any> {
        val sub = subscriptions.findByEndpoint(endpoint) ?: return ResponseEntity.noContent().build()
        subscriptions.delete(sub)
        return ResponseEntity.noContent().build()
    }
}
