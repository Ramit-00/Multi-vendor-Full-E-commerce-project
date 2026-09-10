const { Redis } = require('@upstash/redis');

const restUrl = process.env.UPSTASH_REDIS_REST_URL;
const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;

let redis = null;
let isConfigured = false;

if (restUrl && restToken) {
  try {
    redis = new Redis({
      url: restUrl,
      token: restToken,
    });
    isConfigured = true;
    console.log('[Redis] Upstash Redis client initialized successfully.');
  } catch (err) {
    console.warn('[Redis] Failed to initialize Upstash Redis client:', err.message);
    redis = null;
    isConfigured = false;
  }
} else {
  console.log('[Redis] Upstash Redis credentials not detected; running in in-memory fallback mode.');
}

/**
 * Health check for Redis connectivity
 */
async function checkRedisHealth() {
  if (!isConfigured || !redis) {
    return { status: 'unconfigured', latencyMs: 0 };
  }
  const start = Date.now();
  try {
    const pingKey = 'health:ping';
    await redis.set(pingKey, '1', { ex: 10 });
    const val = await redis.get(pingKey);
    const latencyMs = Date.now() - start;
    if (val === '1' || val === 1) {
      return { status: 'connected', latencyMs };
    }
    return { status: 'degraded', latencyMs };
  } catch (err) {
    return { status: 'offline', error: err.message, latencyMs: Date.now() - start };
  }
}

/**
 * Resilient GET from cache
 */
async function get(key) {
  if (!isConfigured || !redis) return null;
  try {
    const val = await redis.get(key);
    if (val === null || val === undefined) return null;
    return val;
  } catch (err) {
    console.warn(`[Redis] GET failed for key "${key}":`, err.message);
    return null;
  }
}

/**
 * Resilient SET with optional TTL in seconds
 */
async function set(key, value, ttlSeconds = null) {
  if (!isConfigured || !redis) return false;
  try {
    if (ttlSeconds && Number(ttlSeconds) > 0) {
      await redis.set(key, value, { ex: Math.floor(Number(ttlSeconds)) });
    } else {
      await redis.set(key, value);
    }
    return true;
  } catch (err) {
    console.warn(`[Redis] SET failed for key "${key}":`, err.message);
    return false;
  }
}

/**
 * Resilient DEL
 */
async function del(key) {
  if (!isConfigured || !redis) return false;
  try {
    await redis.del(key);
    return true;
  } catch (err) {
    console.warn(`[Redis] DEL failed for key "${key}":`, err.message);
    return false;
  }
}

/**
 * Resilient pattern-based cache purging (e.g. "catalog:*")
 */
async function delPattern(pattern) {
  if (!isConfigured || !redis) return false;
  try {
    const keys = await redis.keys(pattern);
    if (Array.isArray(keys) && keys.length > 0) {
      const chunkSize = 50;
      for (let i = 0; i < keys.length; i += chunkSize) {
        const batch = keys.slice(i, i + chunkSize);
        await redis.del(...batch);
      }
    }
    return true;
  } catch (err) {
    console.warn(`[Redis] delPattern failed for pattern "${pattern}":`, err.message);
    return false;
  }
}

module.exports = {
  redis,
  isConfigured,
  checkRedisHealth,
  get,
  set,
  del,
  delPattern,
};
