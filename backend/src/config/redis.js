const Redis = require('ioredis');
const { env } = require('./env');
const logger = require('../utils/logger');

let client = null;

function getRedisClient() {
  if (!env.redisUrl) return null;
  if (client) return client;

  client = new Redis(env.redisUrl, {
    maxRetriesPerRequest: 2,
    retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 2000)),
    lazyConnect: true,
    reconnectOnError: () => false,
  });

  let hasWarnedUnavailable = false;
  client.on('error', (err) => {
    if (!hasWarnedUnavailable) {
      logger.warn('Redis unavailable, continuing without cache layer', { error: err.message });
      hasWarnedUnavailable = true;
    }
  });

  client.on('connect', () => {
    logger.info('Redis connected');
    hasWarnedUnavailable = false;
  });

  client.connect().catch(() => {});

  return client;
}

async function cacheGet(key) {
  const redis = getRedisClient();
  if (!redis || redis.status !== 'ready') return null;
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    logger.error('Redis GET failed', { key, error: err.message });
    return null;
  }
}

async function cacheSet(key, value, ttlSeconds = 60) {
  const redis = getRedisClient();
  if (!redis || redis.status !== 'ready') return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    logger.error('Redis SET failed', { key, error: err.message });
  }
}

async function cacheDel(pattern) {
  const redis = getRedisClient();
  if (!redis || redis.status !== 'ready') return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  } catch (err) {
    logger.error('Redis DEL failed', { pattern, error: err.message });
  }
}

async function disconnectRedis() {
  if (client) {
    await client.quit();
    client = null;
  }
}

module.exports = { getRedisClient, cacheGet, cacheSet, cacheDel, disconnectRedis };
