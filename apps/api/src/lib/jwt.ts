import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { Role } from '@prisma/client';

export interface JwtAccessPayload {
  sub: string; // userId
  email: string;
  role: Role;
}

export interface JwtRefreshPayload {
  sub: string; // userId
  tokenId: string; // id del RefreshToken en BD
}

export function signAccessToken(payload: JwtAccessPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function signRefreshToken(payload: JwtRefreshPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): JwtAccessPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAccessPayload;
}

export function verifyRefreshToken(token: string): JwtRefreshPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtRefreshPayload;
}

/**
 * Calcula los segundos hasta la expiración del access token (para enviar a clientes).
 */
export function getAccessTokenExpiresIn(): number {
  const value = env.JWT_ACCESS_EXPIRES_IN;
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // fallback 15min
  const [, n, unit] = match;
  const num = Number(n);
  switch (unit) {
    case 's':
      return num;
    case 'm':
      return num * 60;
    case 'h':
      return num * 3600;
    case 'd':
      return num * 86400;
    default:
      return 900;
  }
}
