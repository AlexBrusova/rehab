package com.rehabcenter.domain

import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "TherapistAssignment")
@JsonIgnoreProperties(ignoreUnknown = true)
class TherapistAssignment(
    @Id
    @Column(name = "patientId")
    var patientId: String = "",
    @Column(name = "therapistId", nullable = false)
    var therapistId: String = "",
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patientId", insertable = false, updatable = false)
    @JsonIgnore
    var patient: Patient? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "therapistId", insertable = false, updatable = false)
    @JsonIgnore
    var therapist: AppUser? = null,
)

@Entity
@Table(name = "TherapySession")
@JsonIgnoreProperties(ignoreUnknown = true, value = ["patient", "therapist"])
class TherapySession(
    @Id
    var id: String = "",
    @Column(nullable = false)
    var patientId: String = "",
    @Column(nullable = false)
    var therapistId: String = "",
    @Column(nullable = false)
    var date: String = "",
    @Column(nullable = false)
    var topic: String = "",
    @Column(nullable = false)
    var notes: String = "",
    @Column(nullable = false)
    var urgency: String = "NORMAL",
    var counselorNote: String? = null,
    @get:JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patientId", insertable = false, updatable = false)
    var patient: Patient? = null,
    @get:JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "therapistId", insertable = false, updatable = false)
    var therapist: AppUser? = null,
    @Column(nullable = false)
    var createdAt: Instant = Instant.now(),
    @Column(nullable = false)
    var updatedAt: Instant = Instant.now(),
)
