const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');
const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

const localCounters = new Map();

function localIncrement(prefix, key, windowMs) {
  const fullKey = `${prefix}:${key}`;
  const now = Date.now();
  const entry = localCounters.get(fullKey);
  if (!entry || entry.resetTime <= now) {
    const resetTime = now + windowMs;
    localCounters.set(fullKey, { count: 1, resetTime });
    return { totalHits: 1, resetTime: new Date(resetTime) };
  }
  entry.count += 1;
  return { totalHits: entry.count, resetTime: new Date(entry.resetTime) };
}

function redisStore(prefix) {
  return {
    async increment(key) {
      const redis = getRedisClient();
      if (!redis || redis.status !== 'ready') {
        return localIncrement(prefix, key, env.rateLimit.windowMs);
      }
      try {
        const redisKey = `rl:${prefix}:${key}`;
        const current = await redis.incr(redisKey);
        if (current === 1) await redis.pexpire(redisKey, env.rateLimit.windowMs);
        const ttl = await redis.pttl(redisKey);
        return { totalHits: current, resetTime: new Date(Date.now() + Math.max(ttl, 0)) };
      } catch (err) {
        logger.warn('Redis rate-limit increment failed, using local fallback', { error: err.message });
        return localIncrement(prefix, key, env.rateLimit.windowMs);
      }
    },
    async decrement(key) {
      const redis = getRedisClient();
      if (!redis || redis.status !== 'ready') return;
      try { await redis.decr(`rl:${prefix}:${key}`); } catch {}
    },
    async resetKey(key) {
      const redis = getRedisClient();
      if (!redis || redis.status !== 'ready') {
        localCounters.delete(`${prefix}:${key}`);
        return;
      }
      try { await redis.del(`rl:${prefix}:${key}`); } catch {}
    },
  };
}

function buildLimiter(prefix, max) {
  return rateLimit({
    windowMs: env.rateLimit.windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' },
    store: redisStore(prefix),
    keyGenerator: (req) => `${req.ip}`,
  });
}

const loginLimiter = buildLimiter('login', env.rateLimit.maxLogin);
const registerLimiter = buildLimiter('register', env.rateLimit.maxRegister);
const passwordResetLimiter = buildLimiter('pwreset', env.rateLimit.maxPasswordReset);
const uploadLimiter = buildLimiter('upload', env.rateLimit.maxUpload);

module.exports = { loginLimiter, registerLimiter, passwordResetLimiter, uploadLimiter };
