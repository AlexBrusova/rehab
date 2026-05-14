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
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.Instant

@Entity
@Table(name = "DailySummary")
@JsonIgnoreProperties(ignoreUnknown = true)
class DailySummary(
    @Id
    var id: String = "",
    @Column(name = "counselorId", nullable = false)
    var counselorId: String = "",
    @Column(nullable = false)
    var houseId: String = "",
    @Column(nullable = false)
    var date: String = "",
    @Column(nullable = false)
    var generalText: String = "",
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    var patientSummaries: Map<String, String> = linkedMapOf(),
    var notifiedAt: String? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "counselorId", insertable = false, updatable = false)
    @JsonIgnore
    var counselor: AppUser? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "houseId", insertable = false, updatable = false)
    @JsonIgnore
    var house: House? = null,
    @Column(nullable = false)
    var createdAt: Instant = Instant.now(),
)
