package com.rehabcenter.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "PushSubscription")
class PushSubscription(
    @Id
    var id: String = "",
    @Column(nullable = false)
    var userId: String = "",
    var houseId: String? = null,
    @Column(nullable = false, unique = true, length = 2048)
    var endpoint: String = "",
    @Column(nullable = false, length = 512)
    var p256dh: String = "",
    @Column(nullable = false, length = 128)
    var auth: String = "",
    @Column(nullable = false)
    var createdAt: Instant = Instant.now(),
)
