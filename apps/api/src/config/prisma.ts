import { PrismaClient } from '@prisma/client';
import { isDevelopment } from './env';

/**
 * Singleton de PrismaClient.
 * En desarrollo, hot-reload puede recrear el cliente repetidamente;
 * usamos `globalThis` para conservar la instancia entre reloads.
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log: isDevelopment ? ['warn', 'error'] : ['error'],
  });

if (isDevelopment) {
  globalThis.__prisma = prisma;
}
