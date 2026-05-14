package com.rehabcenter.config

import org.springframework.cache.Cache
import org.springframework.cache.CacheManager
import org.springframework.cache.caffeine.CaffeineCacheManager
import org.springframework.data.redis.cache.RedisCacheManager

/**
 * Объединяет [RedisCacheManager] (сеть) и [CaffeineCacheManager] (процесс) в [TieredCache] на каждое имя.
 */
class TieredCacheManager(
    private val redis: RedisCacheManager,
    private val caffeine: CaffeineCacheManager,
) : CacheManager {
    override fun getCache(name: String): Cache? {
        val primary = redis.getCache(name) ?: return null
        val fb = caffeine.getCache(name) ?: return primary
        return TieredCache(name, primary, fb)
    }

    override fun getCacheNames(): Collection<String> =
        redis.cacheNames + caffeine.cacheNames.filter { it !in redis.cacheNames }
}
