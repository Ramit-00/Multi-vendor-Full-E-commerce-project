const rateLimit = require('express-rate-limit');
const { redis, isConfigured } = require('../config/redis');

/**
 * Custom Upstash Redis Store for express-rate-limit v7
 * Provides distributed rate limiting across serverless lambdas and multi-instance containers.
 */
class UpstashRateLimitStore {
  constructor(options = {}) {
    this.prefix = options.prefix || 'rl:';
    this.redis = options.redis || redis;
  }

  init(options) {
    this.windowMs = options.windowMs || 60000;
  }

  async increment(key) {
    if (!this.redis) {
      return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
    }
    const redisKey = `${this.prefix}${key}`;
    try {
      const p = this.redis.pipeline();
      p.incr(redisKey);
      p.pttl(redisKey);
      const [hits, ttl] = await p.exec();

      let resetTime;
      if (ttl === -1 || ttl === -2) {
        await this.redis.pexpire(redisKey, this.windowMs);
        resetTime = new Date(Date.now() + this.windowMs);
      } else {
        resetTime = new Date(Date.now() + ttl);
      }

      return {
        totalHits: Number(hits),
        resetTime,
      };
    } catch (err) {
      console.warn(`[RateLimiter] Upstash store error for ${key}:`, err.message);
      return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
    }
  }

  async decrement(key) {
    if (!this.redis) return;
    const redisKey = `${this.prefix}${key}`;
    try {
      await this.redis.decr(redisKey);
    } catch (err) {}
  }

  async resetKey(key) {
    if (!this.redis) return;
    const redisKey = `${this.prefix}${key}`;
    try {
      await this.redis.del(redisKey);
    } catch (err) {}
  }
}

const createStore = (prefix) => {
  if (isConfigured && redis) {
    return new UpstashRateLimitStore({ prefix, redis });
  }
  return undefined; // Defaults to express-rate-limit MemoryStore
};

// Strict rate limiter for sensitive authentication endpoints (brute-force defense)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 authentication requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('rl:auth:'),
  message: {
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('rl:api:'),
  message: {
    message: 'Too many requests from this IP, please try again later.',
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});

// Chatbot rate limiter (protects Gemini AI quotas)
const chatbotLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 chatbot requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('rl:chat:'),
  message: {
    message: 'Chatbot rate limit exceeded. Please wait a minute before asking more questions.',
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});

module.exports = {
  authLimiter,
  apiLimiter,
  chatbotLimiter,
  UpstashRateLimitStore,
};

