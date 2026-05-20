import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/**
 * Rate limiter general para toda la API.
 * 100 requests por IP cada 15 min (configurable).
 */
export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    ok: false,
    error: { code: 'RATE_LIMITED', message: 'Demasiadas solicitudes, intenta más tarde.' },
  },
});

/**
 * Rate limiter agresivo para endpoints de autenticación.
 * Protege contra brute-force en login.
 */
export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true, // sólo cuenta intentos fallidos
  message: {
    ok: false,
    error: {
      code: 'AUTH_RATE_LIMITED',
      message: 'Demasiados intentos de autenticación. Intenta en unos minutos.',
    },
  },
});
