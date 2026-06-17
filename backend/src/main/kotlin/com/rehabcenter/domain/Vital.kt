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
@Table(name = "Vital")
@JsonIgnoreProperties(ignoreUnknown = true)
class Vital(
    @Id
    var id: String = "",
    @Column(nullable = false)
    var patientId: String = "",
    @Column(nullable = false)
    var houseId: String = "",
    @Column(nullable = false)
    var systolic: Int = 0,
    @Column(nullable = false)
    var diastolic: Int = 0,
    @Column(nullable = false)
    var pulse: Int = 0,
    @Column(nullable = false)
    var note: String = "",
    @Column(nullable = false)
    var date: String = "",
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
)
