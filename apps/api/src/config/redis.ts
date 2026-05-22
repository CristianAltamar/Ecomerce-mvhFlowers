import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

// Cache client — maxRetriesPerRequest: 3 (fine for cache reads)
let redisInstance: Redis | null = null;

export function getRedis(): Redis | null {
  if (!env.REDIS_URL) return null;
  if (redisInstance) return redisInstance;

  redisInstance = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  redisInstance.on('connect', () => logger.info('Redis conectado'));
  redisInstance.on('error', (err) => logger.error({ err }, 'Error en Redis'));

  return redisInstance;
}

// BullMQ requires maxRetriesPerRequest: null — separate connection per queue/worker
export function createBullMQConnection(): Redis | null {
  if (!env.REDIS_URL) return null;

  const conn = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  conn.on('error', (err) => logger.error({ err }, 'Error en Redis (BullMQ)'));
  return conn;
}

export async function disconnectRedis(): Promise<void> {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
  }
}
