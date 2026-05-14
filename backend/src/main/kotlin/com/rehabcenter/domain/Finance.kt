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

@Entity
@Table(name = "Finance")
@JsonIgnoreProperties(ignoreUnknown = true)
class Finance(
    @Id
    var id: String = "",
    @Column(nullable = false)
    var patientId: String = "",
    @Column(nullable = false)
    var type: String = "",
    @Column(nullable = false)
    var amount: Int = 0,
    @Column(nullable = false)
    var source: String = "",
    @Column(nullable = false)
    var note: String = "",
    @Column(nullable = false)
    var date: String = "",
    @Column(nullable = false)
    var balance: Int = 0,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patientId", insertable = false, updatable = false)
    @JsonIgnore
    var patient: Patient? = null,
    @Column(nullable = false)
    var createdAt: Instant = Instant.now(),
) {
    @get:JsonProperty("cat")
    val cat: String
        get() = source
}
