package com.rehabcenter.domain

import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty
import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.Table
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.Instant

@Entity
@Table(name = "Room")
@JsonIgnoreProperties(ignoreUnknown = true)
class Room(
    @Id
    var id: String = "",
    @Column(nullable = false)
    var number: String = "",
    @Column(nullable = false)
    var building: String = "",
    @Column(nullable = false)
    var capacity: Int = 2,
    @Column(nullable = false)
    var houseId: String = "",
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "houseId", insertable = false, updatable = false)
    @JsonIgnore
    var house: House? = null,
    @Column(nullable = false)
    var createdAt: Instant = Instant.now(),
)

@Entity
@Table(name = "Patient")
@JsonIgnoreProperties(ignoreUnknown = true)
class Patient(
    @Id
    var id: String = "",
    @Column(nullable = false)
    var name: String = "",
    @Column(nullable = false)
    var dob: String = "",
    @Column(nullable = false)
    var admitDate: String = "",
    @Column(nullable = false)
    var daysInRehab: Int = 0,
    @Column(nullable = false)
    var mood: Int = 5,
    var roomId: String? = null,
    @Column(nullable = false)
    var houseId: String = "",
    /** DB column `status` (active | archived). Hidden from JSON — see [getStatus]. */
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(name = "status", nullable = false)
    var patientRecordStatus: String = "active",
    @Column(nullable = false)
    var alert: Boolean = false,
    var awayType: String? = null,
    var dischargeType: String? = null,
    var dischargeDate: String? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "roomId", insertable = false, updatable = false)
    var room: Room? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "houseId", insertable = false, updatable = false)
    @JsonIgnore
    var house: House? = null,
    @OneToMany(mappedBy = "patient", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    var meds: MutableList<Med> = mutableListOf(),
    @Column(nullable = false)
    var createdAt: Instant = Instant.now(),
    @Column(nullable = false)
    var updatedAt: Instant = Instant.now(),
) {
    /** Matches legacy Node API: away residents surface as status "away". */
    @get:JsonProperty("status")
    val status: String
        get() = if (!awayType.isNullOrBlank()) "away" else patientRecordStatus
}

@Entity
@Table(name = "Med")
@JsonIgnoreProperties(ignoreUnknown = true)
class Med(
    @Id
    var id: String = "",
    @Column(nullable = false)
    var patientId: String = "",
    @Column(nullable = false)
    var name: String = "",
    @Column(nullable = false)
    var dose: String = "",
    @Column(nullable = false)
    var unit: String = "mg",
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "times", nullable = false)
    var times: List<String> = emptyList(),
    var startDate: String? = null,
    var endDate: String? = null,
    var prescribedBy: String? = null,
    var notes: String? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patientId", insertable = false, updatable = false)
    @JsonIgnore
    var patient: Patient? = null,
    @OneToMany(mappedBy = "med", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    var distributions: MutableList<MedDistribution> = mutableListOf(),
    @Column(nullable = false)
    var createdAt: Instant = Instant.now(),
    @Column(nullable = false)
    var updatedAt: Instant = Instant.now(),
)

@Entity
@Table(name = "Phone")
@JsonIgnoreProperties(ignoreUnknown = true)
class Phone(
    @Id
    var id: String = "",
    @Column(nullable = false)
    var patientId: String = "",
    @Column(nullable = false)
    var givenAt: String = "",
    @Column(nullable = false)
    var returnBy: String = "",
    var returnedAt: String? = null,
    @Column(nullable = false)
    var late: Boolean = false,
    @Column(nullable = false)
    var status: String = "active",
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patientId", insertable = false, updatable = false)
    @JsonIgnore
    var patient: Patient? = null,
    @Column(nullable = false)
    var createdAt: Instant = Instant.now(),
)

@Entity
@Table(name = "Shift")
@JsonIgnoreProperties(ignoreUnknown = true)
class Shift(
    @Id
    var id: String = "",
    @Column(nullable = false)
    var houseId: String = "",
    @Column(name = "counselorId", nullable = false)
    var counselorId: String = "",
    @Column(nullable = false)
    var date: String = "",
    @Column(nullable = false)
    var shift: String = "24h",
    @Column(nullable = false)
    var status: String = "pending",
    var note: String? = null,
    var receivedFrom: String? = null,
    var handedTo: String? = null,
    @Column(nullable = false)
    var accepted: Boolean = false,
    var start: String? = null,
    var end: String? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "houseId", insertable = false, updatable = false)
    @JsonIgnore
    var house: House? = null,
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "counselorId", insertable = false, updatable = false)
    @JsonIgnoreProperties(
        value = [
            "passwordHash", "allowedHouses", "house", "username", "role", "roleLabel",
            "phone", "allHousesAccess", "houseId", "createdAt", "updatedAt",
        ],
        allowGetters = true,
    )
    var counselor: AppUser? = null,
    @Column(nullable = false)
    var createdAt: Instant = Instant.now(),
    @Column(nullable = false)
    var updatedAt: Instant = Instant.now(),
)

@Entity
@Table(name = "Consequence")
@JsonIgnoreProperties(ignoreUnknown = true)
class Consequence(
    @Id
    var id: String = "",
    @Column(nullable = false)
    var patientId: String = "",
    @Column(nullable = false)
    var houseId: String = "",
    @Column(nullable = false)
    var type: String = "",
    @Column(nullable = false)
    var description: String = "",
    @Column(nullable = false)
    var date: String = "",
    @Column(nullable = false)
    var status: String = "pending",
    var approvedBy: String? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patientId", insertable = false, updatable = false)
    @JsonIgnore
    var patient: Patient? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "houseId", insertable = false, updatable = false)
    @JsonIgnore
    var house: House? = null,
    @Column(nullable = false)
    var createdAt: Instant = Instant.now(),
    @Column(nullable = false)
    var updatedAt: Instant = Instant.now(),
)
