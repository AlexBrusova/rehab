package com.rehabcenter.service

import com.rehabcenter.repo.HouseRepository
import io.github.resilience4j.retry.annotation.Retry
import org.springframework.cache.annotation.Cacheable
import org.springframework.stereotype.Service

/**
 * Чтение списка домов с кешем и повторными попытками при кратковременных сбоях БД
 * (пулы, сеть, перезапуск инстанса).
 */
@Service
class HouseQueryService(
    private val houses: HouseRepository,
) {
    @Cacheable(cacheNames = ["houses"], key = "'all'")
    @Retry(name = "db-read")
    fun listAllOrderedByName() = houses.findAllByOrderByNameAsc()
}
