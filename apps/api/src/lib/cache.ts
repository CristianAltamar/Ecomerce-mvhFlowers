import { getRedis } from '../config/redis';

const DEFAULT_TTL = 300; // 5 minutes

/**
 * Versión del namespace de caché. SÚBELA cuando cambie la FORMA de los datos
 * que se cachean (p. ej. renombrar campos como priceCents→price), para que las
 * entradas viejas con el esquema anterior dejen de leerse y se regeneren frescas.
 */
const CACHE_VERSION = 'v2';
const ns = (key: string) => `${CACHE_VERSION}:${key}`;

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const redis = getRedis();
    if (!redis) return null;
    const raw = await redis.get(ns(key));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds = DEFAULT_TTL): Promise<void> {
    const redis = getRedis();
    if (!redis) return;
    await redis.set(ns(key), JSON.stringify(value), 'EX', ttlSeconds);
  },

  async del(...keys: string[]): Promise<void> {
    const redis = getRedis();
    if (!redis) return;
    if (keys.length > 0) await redis.del(...keys.map(ns));
  },

  async delPattern(pattern: string): Promise<void> {
    const redis = getRedis();
    if (!redis) return;
    const keys = await redis.keys(ns(pattern));
    if (keys.length > 0) await redis.del(...keys);
  },
};