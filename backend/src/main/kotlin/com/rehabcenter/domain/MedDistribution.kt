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
@Table(name = "MedDistribution")
@JsonIgnoreProperties(ignoreUnknown = true)
class MedDistribution(
    @Id
    var id: String = "",
    @Column(nullable = false)
    var patientId: String = "",
    @Column(nullable = false)
    var medId: String = "",
    @Column(nullable = false)
    var date: String = "",
    @Column(nullable = false)
    var time: String = "",
    @Column(nullable = false)
    var given: Boolean = false,
    var givenAt: String? = null,
    var givenBy: String? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patientId", insertable = false, updatable = false)
    @JsonIgnore
    var patient: Patient? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medId", insertable = false, updatable = false)
    @JsonIgnore
    var med: Med? = null,
    @Column(nullable = false)
    var createdAt: Instant = Instant.now(),
)
