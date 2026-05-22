import { getRedis } from '../config/redis';

const DEFAULT_TTL = 300; // 5 minutes

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const redis = getRedis();
    if (!redis) return null;
    const raw = await redis.get(key);
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
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  },

  async del(...keys: string[]): Promise<void> {
    const redis = getRedis();
    if (!redis) return;
    if (keys.length > 0) await redis.del(...keys);
  },

  async delPattern(pattern: string): Promise<void> {
    const redis = getRedis();
    if (!redis) return;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  },
};