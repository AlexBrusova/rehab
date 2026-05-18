package com.rehabcenter.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.rehabcenter.domain.PushSubscription
import com.rehabcenter.repo.PushSubscriptionRepository
import nl.martijndwars.webpush.Notification
import nl.martijndwars.webpush.PushService
import nl.martijndwars.webpush.Utils
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.security.Security

@Service
class PushSender(
    private val subscriptions: PushSubscriptionRepository,
    private val mapper: ObjectMapper,
    @Value("\${push.vapid.public-key:}") private val vapidPublicKey: String,
    @Value("\${push.vapid.private-key:}") private val vapidPrivateKey: String,
    @Value("\${push.vapid.subject:mailto:admin@rehab.app}") private val vapidSubject: String,
) {
    private val log = LoggerFactory.getLogger(javaClass)
    private val pushService: PushService? by lazy { buildPushService() }

    init {
        Security.addProvider(org.bouncycastle.jce.provider.BouncyCastleProvider())
        if (vapidPublicKey.isBlank() || vapidPrivateKey.isBlank()) {
            val kp = Utils.generateVAPIDKeyPair()
            val pub = java.util.Base64.getUrlEncoder().withoutPadding()
                .encodeToString(Utils.savePublicKey(kp.public as java.security.interfaces.ECPublicKey))
            val priv = java.util.Base64.getUrlEncoder().withoutPadding()
                .encodeToString(Utils.savePrivateKey(kp.private as java.security.interfaces.ECPrivateKey))
            log.warn("=== VAPID keys not configured. Add to env vars: ===")
            log.warn("VAPID_PUBLIC_KEY={}", pub)
            log.warn("VAPID_PRIVATE_KEY={}", priv)
            log.warn("VAPID_SUBJECT=mailto:admin@rehab.app")
            log.warn("=== Push notifications are DISABLED until keys are set ===")
        }
    }

    private fun buildPushService(): PushService? {
        if (vapidPublicKey.isBlank() || vapidPrivateKey.isBlank()) return null
        return try {
            val svc = PushService()
            svc.setPublicKey(vapidPublicKey)
            svc.setPrivateKey(vapidPrivateKey)
            svc.setSubject(vapidSubject)
            svc
        } catch (e: Exception) {
            log.error("Failed to initialize PushService", e)
            null
        }
    }

    fun vapidPublicKeyBase64(): String = vapidPublicKey

    fun send(sub: PushSubscription, title: String, body: String, url: String = "/") {
        val svc = pushService ?: return
        try {
            val payload = mapper.writeValueAsString(mapOf("title" to title, "body" to body, "url" to url))
            val notification = Notification(sub.endpoint, sub.p256dh, sub.auth, payload)
            svc.send(notification)
        } catch (e: Exception) {
            log.warn("Push send failed for endpoint {}: {}", sub.endpoint.take(60), e.message)
            if (e.message?.contains("410") == true || e.message?.contains("404") == true) {
                subscriptions.deleteById(sub.id)
                log.info("Removed expired push subscription {}", sub.id)
            }
        }
    }

    fun sendToHouseManagers(houseId: String, title: String, body: String, url: String = "/") {
        subscriptions.findManagersForHouse(houseId).forEach { send(it, title, body, url) }
    }

    fun sendToHouse(houseId: String, title: String, body: String, url: String = "/") {
        subscriptions.findByHouseId(houseId).forEach { send(it, title, body, url) }
    }
}
