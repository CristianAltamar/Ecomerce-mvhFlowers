import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

/**
 * Cliente Redis opcional. Si no hay REDIS_URL, se loggea un warning
 * y la app sigue funcionando (cache deshabilitado).
 */
let redisInstance: Redis | null = null;

export function getRedis(): Redis | null {
  if (!env.REDIS_URL) return null;
  if (redisInstance) return redisInstance;

  redisInstance = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  redisInstance.on('connect', () => logger.info('🔴 Redis conectado'));
  redisInstance.on('error', (err) => logger.error({ err }, 'Error en Redis'));

  return redisInstance;
}

export async function disconnectRedis(): Promise<void> {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
  }
}
