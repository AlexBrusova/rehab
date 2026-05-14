package com.rehabcenter.domain

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.IdClass
import jakarta.persistence.Table
import java.io.Serializable

data class ShiftDistId(
    var patientId: String = "",
    var shift: String = "",
    var date: String = "",
) : Serializable

/**
 * Per-shift medication distribution row (legacy Prisma table `ShiftDist`).
 * Same HTTP path as the old Node `/api/distributions` (not [MedDistribution]).
 */
@Entity
@Table(name = "ShiftDist")
@IdClass(ShiftDistId::class)
@JsonIgnoreProperties(ignoreUnknown = true)
class ShiftDist(
    @Id
    @Column(name = "patientId", nullable = false)
    var patientId: String = "",
    @Id
    @Column(nullable = false)
    var shift: String = "",
    @Id
    @Column(nullable = false)
    var date: String = "",
    @Column(nullable = true)
    var status: String? = null,
)
