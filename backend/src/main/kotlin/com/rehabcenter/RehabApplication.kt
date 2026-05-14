package com.rehabcenter

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class RehabApplication

fun main(args: Array<String>) {
    runApplication<RehabApplication>(*args)
}
