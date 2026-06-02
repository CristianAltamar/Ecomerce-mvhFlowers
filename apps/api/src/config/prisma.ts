import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { env, isDevelopment } from './env';

/**
 * Singleton de PrismaClient.
 * En desarrollo, hot-reload puede recrear el cliente repetidamente;
 * usamos `globalThis` para conservar la instancia entre reloads.
 *
 * Desde Prisma 7 el cliente se conecta mediante un driver adapter
 * (`@prisma/adapter-pg`); la URL ya no vive en el schema (ver prisma.config.ts).
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    adapter,
    log: isDevelopment ? ['warn', 'error'] : ['error'],
  });

if (isDevelopment) {
  globalThis.__prisma = prisma;
}
