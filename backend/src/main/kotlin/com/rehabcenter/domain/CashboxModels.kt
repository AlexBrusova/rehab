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
@Table(name = "CashboxEntry")
@JsonIgnoreProperties(ignoreUnknown = true)
class CashboxEntry(
    @Id
    var id: String = "",
    @Column(nullable = false)
    var houseId: String = "",
    @Column(nullable = false)
    var type: String = "",
    @Column(nullable = false)
    var amount: Int = 0,
    @Column(nullable = false)
    var cat: String = "",
    @Column(nullable = false)
    var note: String = "",
    @Column(nullable = false)
    var date: String = "",
    @Column(nullable = false)
    var time: String = "",
    @get:JsonProperty("by")
    @Column(name = "by", nullable = false)
    var byStaff: String = "",
    @Column(nullable = false)
    var balance: Int = 0,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "houseId", insertable = false, updatable = false)
    @JsonIgnore
    var house: House? = null,
    @Column(nullable = false)
    var createdAt: Instant = Instant.now(),
)

@Entity
@Table(name = "CashboxCount")
@JsonIgnoreProperties(ignoreUnknown = true)
class CashboxCount(
    @Id
    var id: String = "",
    @Column(nullable = false)
    var houseId: String = "",
    @Column(nullable = false)
    var countedBy: String = "",
    @Column(nullable = false)
    var amount: Int = 0,
    @Column(nullable = false)
    var expected: Int = 0,
    @Column(nullable = false)
    var diff: Int = 0,
    @Column(nullable = false)
    var date: String = "",
    @Column(nullable = false)
    var time: String = "",
    var notes: String? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "houseId", insertable = false, updatable = false)
    @JsonIgnore
    var house: House? = null,
    @Column(nullable = false)
    var createdAt: Instant = Instant.now(),
)
