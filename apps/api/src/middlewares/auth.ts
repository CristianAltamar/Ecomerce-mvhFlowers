import type { Request, RequestHandler } from 'express';
import type { Role } from '@prisma/client';
import { verifyAccessToken, type JwtAccessPayload } from '../lib/jwt';
import { UnauthorizedError, ForbiddenError } from '../lib/errors';

/**
 * Extiende Request para incluir el usuario autenticado.
 */
export interface AuthenticatedRequest extends Request {
  user: JwtAccessPayload;
}

/**
 * Middleware que exige autenticación mediante JWT Bearer.
 * Si el token es válido, agrega `req.user` con el payload.
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token de acceso requerido'));
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = verifyAccessToken(token);
    (req as AuthenticatedRequest).user = payload;
    next();
  } catch {
    next(new UnauthorizedError('Token inválido o expirado'));
  }
};

/**
 * Middleware opcional: si hay token válido, agrega req.user; si no, sigue sin error.
 * Útil para endpoints públicos que reciben info extra si el usuario está autenticado.
 */
export const optionalAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();
  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = verifyAccessToken(token);
    (req as AuthenticatedRequest).user = payload;
  } catch {
    // token inválido → ignoramos silenciosamente
  }
  next();
};

/**
 * Middleware que exige uno o varios roles. Debe ir DESPUÉS de requireAuth.
 *
 * @example router.delete('/products/:id', requireAuth, requireRole('ADMIN'), handler)
 */
export function requireRole(...allowed: Role[]): RequestHandler {
  return (req, _res, next) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return next(new UnauthorizedError());
    if (!allowed.includes(user.role)) {
      return next(new ForbiddenError(`Requiere rol: ${allowed.join(' o ')}`));
    }
    next();
  };
}
