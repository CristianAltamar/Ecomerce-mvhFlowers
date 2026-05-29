import 'dotenv/config';
import { z } from 'zod';

/**
 * Schema de validación de variables de entorno.
 * Si una variable obligatoria falta, la app falla al arrancar — comportamiento intencional.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_BASE_URL: z.string().url().default('http://localhost:4000'),
  WEB_BASE_URL: z.string().url().default('http://localhost:3000'), // base del frontend (redirección Bold)
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((s) => s.split(',').map((o) => o.trim()).filter(Boolean)),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET debe tener al menos 32 caracteres'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  BCRYPT_ROUNDS: z.coerce.number().int().min(8).max(15).default(10),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000), // 15 min
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Bold — botón de pagos embebido
  BOLD_API_KEY: z.string().optional(),     // llave de IDENTIDAD (pública, va en data-api-key)
  BOLD_SECRET_KEY: z.string().optional(),  // llave SECRETA (firma de integridad + webhook)
  BOLD_WEBHOOK_SECRET: z.string().optional(), // opcional: override de la llave para verificar webhook (por defecto usa BOLD_SECRET_KEY)
  BOLD_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
  // Solo dev/sandbox: si 'true' y NODE_ENV!=production, omite la verificación de firma del webhook
  BOLD_WEBHOOK_SKIP_VERIFY: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),

  // Email (SMTP) — opcional; sin config no se envían emails
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('MVH Flores <hola@mvhflores.co>'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Variables de entorno inválidas:');
  // eslint-disable-next-line no-console
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
