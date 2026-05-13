package com.rehabcenter.domain

import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty
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
data class GroupAttendanceId(
    @Column(name = "groupId", nullable = false)
    var groupId: String = "",
    @Column(name = "patientId", nullable = false)
    var patientId: String = "",
) : Serializable

@Entity
@Table(name = "GroupAttendance")
@JsonIgnoreProperties(ignoreUnknown = true)
class GroupAttendance(
    @EmbeddedId
    @JsonIgnore
    var id: GroupAttendanceId = GroupAttendanceId(),
    @Column(nullable = false)
    var status: String = "present",
    @MapsId("groupId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "groupId", nullable = false)
    @JsonIgnore
    var group: ResidentGroup? = null,
    @MapsId("patientId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patientId", nullable = false)
    @JsonIgnore
    var patient: Patient? = null,
) {
    @get:JsonProperty("id")
    val rowId: String
        get() = "${id.groupId}_${id.patientId}"

    @get:JsonProperty("sessionId")
    val sessionId: String
        get() = id.groupId

    @get:JsonProperty("patientId")
    val patientId: String
        get() = id.patientId
}

@Entity(name = "ResidentGroup")
@Table(name = "Group")
@JsonIgnoreProperties(ignoreUnknown = true)
class ResidentGroup(
    @Id
    var id: String = "",
    @Column(nullable = false)
    var houseId: String = "",
    @Column(nullable = false)
    var date: String = "",
    @Column(nullable = false)
    var topic: String = "",
    @Column(nullable = false)
    var type: String = "therapeutic",
    @Column(nullable = false)
    var time: String = "",
    @Column(nullable = false)
    var status: String = "active",
    var leaderId: String? = null,
    var notes: String? = null,
    @OneToMany(mappedBy = "group", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    var attendance: MutableList<GroupAttendance> = mutableListOf(),
    @Column(nullable = false)
    var createdAt: Instant = Instant.now(),
)
