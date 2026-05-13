package com.rehabcenter.web

import com.rehabcenter.repo.HouseRepository
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/houses")
class HouseController(
    private val houses: HouseRepository,
) {
    @GetMapping
    fun list() = houses.findAllByOrderByNameAsc()
}
