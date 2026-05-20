import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getAccessTokenExpiresIn,
} from '../../lib/jwt';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
} from '../../lib/errors';
import type { RegisterInput, LoginInput } from './auth.schemas';
import type { User } from '@prisma/client';

interface AuthContext {
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Hashea un refresh token antes de guardarlo (nunca guardar tokens en plaintext).
 */
function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Calcula la fecha de expiración del refresh token a partir de JWT_REFRESH_EXPIRES_IN.
 */
function refreshExpiresAt(): Date {
  const value = env.JWT_REFRESH_EXPIRES_IN;
  const match = value.match(/^(\d+)([dhms])$/);
  if (!match) return new Date(Date.now() + 30 * 86400 * 1000);
  const [, n, unit] = match;
  const num = Number(n);
  const ms = unit === 'd' ? num * 86400_000 : unit === 'h' ? num * 3600_000 : unit === 'm' ? num * 60_000 : num * 1000;
  return new Date(Date.now() + ms);
}

function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

async function issueTokens(user: User, ctx: AuthContext) {
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });

  const tokenRecord = await prisma.refreshToken.create({
    data: {
      tokenHash: '', // placeholder, lo seteamos abajo
      userId: user.id,
      expiresAt: refreshExpiresAt(),
      userAgent: ctx.userAgent,
      ipAddress: ctx.ipAddress,
    },
  });

  const refreshToken = signRefreshToken({ sub: user.id, tokenId: tokenRecord.id });

  await prisma.refreshToken.update({
    where: { id: tokenRecord.id },
    data: { tokenHash: hashRefreshToken(refreshToken) },
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: getAccessTokenExpiresIn(),
  };
}

export const authService = {
  async register(input: RegisterInput, ctx: AuthContext) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictError('Ya existe una cuenta con este email');

    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        role: 'CUSTOMER',
      },
    });

    const tokens = await issueTokens(user, ctx);
    return { user: toPublicUser(user), tokens };
  },

  async login(input: LoginInput, ctx: AuthContext) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.isActive) {
      // Mismo mensaje genérico tanto si no existe como si la pwd es incorrecta:
      // evita enumeración de cuentas.
      throw new UnauthorizedError('Credenciales inválidas');
    }
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedError('Credenciales inválidas');

    const tokens = await issueTokens(user, ctx);
    return { user: toPublicUser(user), tokens };
  },

  async refresh(refreshToken: string, ctx: AuthContext) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Refresh token inválido o expirado');
    }

    const record = await prisma.refreshToken.findUnique({ where: { id: payload.tokenId } });
    if (!record) throw new UnauthorizedError('Refresh token desconocido');
    if (record.revokedAt) throw new UnauthorizedError('Refresh token revocado');
    if (record.expiresAt < new Date()) throw new UnauthorizedError('Refresh token expirado');
    if (record.tokenHash !== hashRefreshToken(refreshToken)) {
      // Si el hash no coincide, alguien usó un token reciclado: revocamos
      // todos los tokens del usuario por seguridad.
      await prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedError('Refresh token comprometido — sesión cerrada');
    }

    const user = await prisma.user.findUnique({ where: { id: record.userId } });
    if (!user || !user.isActive) throw new UnauthorizedError('Cuenta no disponible');

    // Rotación: invalidamos el viejo y emitimos uno nuevo
    await prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await issueTokens(user, ctx);
    return { user: toPublicUser(user), tokens };
  },

  async logout(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { id: payload.tokenId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // logout idempotente: si el token es inválido, no falla
    }
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Usuario no encontrado');
    return toPublicUser(user);
  },
};

// Reexports usados por el controller
export { BadRequestError };
