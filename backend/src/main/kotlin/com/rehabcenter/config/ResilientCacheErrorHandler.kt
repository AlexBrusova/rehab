package com.rehabcenter.config

import org.slf4j.LoggerFactory
import org.springframework.cache.Cache
import org.springframework.cache.interceptor.CacheErrorHandler

/**
 * При недоступности Redis (или другого провайдера кеша) не роняем запрос:
 * GET — пропускаем кеш и идём в источник; PUT/EVICT/CLEAR — логируем и продолжаем
 * (возможна кратковременная рассинхронизация кеша с БД).
 */
class ResilientCacheErrorHandler : CacheErrorHandler {
    private val log = LoggerFactory.getLogger(javaClass)

    override fun handleCacheGetError(
        exception: RuntimeException,
        cache: Cache,
        key: Any,
    ) {
        log.warn(
            "Cache GET failed for cache={} key={} — bypassing cache and using source",
            cache.name,
            key,
            exception,
        )
    }

    override fun handleCachePutError(
        exception: RuntimeException,
        cache: Cache,
        key: Any,
        value: Any?,
    ) {
        log.warn(
            "Cache PUT failed for cache={} key={} — continuing without cache update",
            cache.name,
            key,
            exception,
        )
    }

    override fun handleCacheEvictError(
        exception: RuntimeException,
        cache: Cache,
        key: Any,
    ) {
        log.warn(
            "Cache EVICT failed for cache={} key={} — continuing",
            cache.name,
            key,
            exception,
        )
    }

    override fun handleCacheClearError(
        exception: RuntimeException,
        cache: Cache,
    ) {
        log.warn("Cache CLEAR failed for cache={} — continuing", cache.name, exception)
    }
}
