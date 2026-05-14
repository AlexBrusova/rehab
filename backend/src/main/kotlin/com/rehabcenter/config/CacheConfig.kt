package com.rehabcenter.config

import org.springframework.boot.autoconfigure.cache.CacheProperties
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.cache.annotation.EnableCaching
import org.springframework.cache.interceptor.CacheErrorHandler
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
@EnableCaching
@EnableConfigurationProperties(CacheProperties::class)
class CacheConfig {
    @Bean
    fun cacheErrorHandler(): CacheErrorHandler = ResilientCacheErrorHandler()
}
