package com.rehabcenter.domain

import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.Instant

@Entity(name = "CounselorSchedule")
@Table(name = "Schedule")
@JsonIgnoreProperties(ignoreUnknown = true)
class CounselorSchedule(
    @Id
    var id: String = "",
    @Column(nullable = false)
    var houseId: String = "",
    @Column(name = "counselorId", nullable = false)
    var counselorId: String = "",
    @Column(nullable = false)
    var date: String = "",
    @JsonProperty("shift")
    @Column(name = "shiftType", nullable = false)
    var shiftType: String = "24h",
    var note: String? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "houseId", insertable = false, updatable = false)
    @JsonIgnore
    var house: House? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "counselorId", insertable = false, updatable = false)
    @JsonIgnore
    var counselor: AppUser? = null,
    @Column(nullable = false)
    var createdAt: Instant = Instant.now(),
)
