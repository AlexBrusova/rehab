package com.rehabcenter.config

import com.github.benmanes.caffeine.cache.Caffeine
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.cache.CacheProperties
import org.springframework.cache.CacheManager
import org.springframework.cache.caffeine.CaffeineCacheManager
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary
import org.springframework.context.annotation.Profile
import org.springframework.data.redis.cache.CacheKeyPrefix
import org.springframework.data.redis.cache.RedisCacheConfiguration
import org.springframework.data.redis.cache.RedisCacheManager
import org.springframework.data.redis.connection.RedisConnectionFactory
import java.time.Duration

/**
 * В профиле [docker]: Redis как основной кеш + Caffeine в памяти процесса как fallback
 * при недоступности или ошибках Redis.
 */
@Configuration
@Profile("docker")
class DockerTieredCacheConfiguration(
    private val redisConnectionFactory: RedisConnectionFactory,
    private val cacheProperties: CacheProperties,
    @Value("\${spring.cache.cache-names:houses}")
    private val cacheNamesCsv: String,
) {
    @Bean
    @Primary
    fun cacheManager(): CacheManager {
        val names = cacheNamesCsv.split(",").map { it.trim() }.filter { it.isNotEmpty() }.toSet()
        val ttl = cacheProperties.redis.timeToLive ?: Duration.ofDays(1)

        var redisDefaults = RedisCacheConfiguration.defaultCacheConfig().entryTtl(ttl)
        if (cacheProperties.redis.isUseKeyPrefix && !cacheProperties.redis.keyPrefix.isNullOrBlank()) {
            val p = cacheProperties.redis.keyPrefix!!
            redisDefaults = redisDefaults.computePrefixWith(CacheKeyPrefix.prefixed(p))
        }

        val redis =
            RedisCacheManager.builder(redisConnectionFactory)
                .transactionAware()
                .cacheDefaults(redisDefaults)
                .initialCacheNames(names)
                .build()

        val caffeine =
            CaffeineCacheManager().apply {
                setCacheNames(names.toList())
                setCaffeine(
                    Caffeine.newBuilder()
                        .maximumSize(10_000)
                        .expireAfterWrite(ttl),
                )
            }

        return TieredCacheManager(redis, caffeine)
    }
}
