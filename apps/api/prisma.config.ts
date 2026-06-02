import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

/**
 * Configuración de Prisma (requerida desde Prisma 7).
 * Reemplaza el bloque `"prisma"` que vivía en package.json.
 * - Importa `dotenv/config` porque desde v7 el CLI ya NO carga `.env` automáticamente.
 * - La URL de conexión vive aquí (ya no se permite `url` en el datasource del schema);
 *   el runtime se conecta vía driver adapter (`@prisma/adapter-pg`) en `config/prisma.ts`.
 *
 * Use process.env with a fallback so `prisma generate` can run during build
 * without a real DATABASE_URL. Only migrations and runtime need a real connection.
 */
const databaseUrl =
  process.env.DATABASE_URL ?? 'postgresql://placeholder:placeholder@localhost:5432/placeholder';

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: databaseUrl,
  },
});
