package com.rehabcenter.config

import java.util.concurrent.Callable
import org.slf4j.LoggerFactory
import org.springframework.cache.Cache

/**
 * Двухуровневый кеш: основной (Redis) и локальный fallback (Caffeine).
 * При ошибке чтения/записи в Redis запрос обслуживается из fallback без падения запроса.
 */
class TieredCache(
    private val cacheName: String,
    private val primary: Cache,
    private val fallback: Cache,
) : Cache {
    private val log = LoggerFactory.getLogger(javaClass)

    override fun getName(): String = cacheName

    override fun getNativeCache(): Any = primary.nativeCache

    override fun get(key: Any): Cache.ValueWrapper? {
        try {
            val v = primary[key]
            if (v != null) {
                warmFallback(key, v.get())
                return v
            }
        } catch (ex: Exception) {
            log.warn("Primary cache '{}' GET key={} failed, using fallback", cacheName, key, ex)
        }
        return try {
            fallback[key]
        } catch (ex: Exception) {
            log.warn("Fallback cache '{}' GET key={} failed", cacheName, key, ex)
            null
        }
    }

    override fun <T : Any?> get(key: Any, type: Class<T>?): T? {
        try {
            val v = primary.get(key, type)
            if (v != null) {
                warmFallback(key, v)
                return v
            }
        } catch (ex: Exception) {
            log.warn("Primary cache '{}' typed GET key={} failed, using fallback", cacheName, key, ex)
        }
        return try {
            fallback.get(key, type)
        } catch (ex: Exception) {
            log.warn("Fallback cache '{}' typed GET key={} failed", cacheName, key, ex)
            null
        }
    }

    override fun <T : Any?> get(key: Any, valueLoader: Callable<T>): T {
        try {
            primary.get(key, valueLoader)?.let {
                return it
            }
        } catch (ex: Exception) {
            log.warn("Primary cache '{}' get-or-load key={} failed, using fallback", cacheName, key, ex)
        }
        return fallback.get(key, valueLoader)
            ?: throw IllegalStateException("Cache '$cacheName' valueLoader returned null for key=$key")
    }

    override fun put(key: Any, value: Any?) {
        try {
            primary.put(key, value)
        } catch (ex: Exception) {
            log.warn("Primary cache '{}' PUT key={} failed", cacheName, key, ex)
        }
        try {
            fallback.put(key, value)
        } catch (ex: Exception) {
            log.warn("Fallback cache '{}' PUT key={} failed", cacheName, key, ex)
        }
    }

    override fun evict(key: Any) {
        try {
            primary.evict(key)
        } catch (ex: Exception) {
            log.warn("Primary cache '{}' EVICT key={} failed", cacheName, key, ex)
        }
        try {
            fallback.evict(key)
        } catch (ex: Exception) {
            log.warn("Fallback cache '{}' EVICT key={} failed", cacheName, key, ex)
        }
    }

    override fun clear() {
        try {
            primary.clear()
        } catch (ex: Exception) {
            log.warn("Primary cache '{}' CLEAR failed", cacheName, ex)
        }
        try {
            fallback.clear()
        } catch (ex: Exception) {
            log.warn("Fallback cache '{}' CLEAR failed", cacheName, ex)
        }
    }

    private fun warmFallback(key: Any, value: Any?) {
        if (value == null) return
        try {
            fallback.put(key, value)
        } catch (ex: Exception) {
            log.debug("Fallback warm PUT failed for cache '{}' key={}", cacheName, key, ex)
        }
    }
}
