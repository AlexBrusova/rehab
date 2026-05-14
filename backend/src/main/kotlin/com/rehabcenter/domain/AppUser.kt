package com.rehabcenter.domain

import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonUnwrapped
import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.EmbeddedId
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.MapsId
import jakarta.persistence.OneToMany
import jakarta.persistence.Table
import java.io.Serializable
import java.time.Instant

@Embeddable
data class UserHouseAccessId(
    @Column(name = "userId", nullable = false)
    var userId: String = "",
    @Column(name = "houseId", nullable = false)
    var houseId: String = "",
) : Serializable

@Entity
@Table(name = "UserHouseAccess")
@JsonIgnoreProperties(ignoreUnknown = true)
class UserHouseAccess(
    @EmbeddedId
    @JsonUnwrapped
    var id: UserHouseAccessId = UserHouseAccessId(),
    @MapsId("userId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "userId", nullable = false)
    @JsonIgnore
    var user: AppUser? = null,
)

@Entity
@Table(name = "User")
@JsonIgnoreProperties(ignoreUnknown = true)
class AppUser(
    @Id
    var id: String = "",
    @Column(nullable = false, unique = true)
    var username: String = "",
    @JsonIgnore
    @Column(name = "passwordHash", nullable = false)
    var passwordHash: String = "",
    @Column(nullable = false)
    var name: String = "",
    @Column(nullable = false)
    var role: String = "",
    @Column(nullable = false)
    var roleLabel: String = "",
    @Column(nullable = false)
    var initials: String = "",
    @Column(nullable = false)
    var color: String = "#1e5fa8",
    var phone: String? = null,
    @Column(nullable = false)
    var allHousesAccess: Boolean = false,
    var houseId: String? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "houseId", insertable = false, updatable = false)
    @JsonIgnoreProperties(
        value = [
            "users", "patients", "rooms", "groups", "shifts", "schedules",
            "consequences", "cashbox", "cashboxCounts", "dailySummaries", "absences",
        ],
        allowGetters = true,
    )
    var house: House? = null,
    @OneToMany(mappedBy = "user", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("user", allowGetters = true)
    var allowedHouses: MutableList<UserHouseAccess> = mutableListOf(),
    @Column(nullable = false)
    var createdAt: Instant = Instant.now(),
    @Column(nullable = false)
    var updatedAt: Instant = Instant.now(),
)
