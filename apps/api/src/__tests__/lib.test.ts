import { describe, it, expect } from 'vitest';
import { signAccessToken, verifyAccessToken, getAccessTokenExpiresIn } from '../lib/jwt';
import { BadRequestError, NotFoundError, AppError } from '../lib/errors';

describe('JWT helpers', () => {
  it('firma y verifica access tokens', () => {
    const payload = { sub: 'user_123', email: 'a@b.com', role: 'CUSTOMER' as const };
    const token = signAccessToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe('user_123');
    expect(decoded.email).toBe('a@b.com');
    expect(decoded.role).toBe('CUSTOMER');
  });

  it('rechaza tokens manipulados', () => {
    const payload = { sub: 'user_123', email: 'a@b.com', role: 'CUSTOMER' as const };
    const token = signAccessToken(payload);
    const tampered = token.slice(0, -3) + 'xxx';
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it('calcula expiresIn en segundos', () => {
    // Con default '15m' del env de test → 900 segundos
    expect(getAccessTokenExpiresIn()).toBe(900);
  });
});

describe('AppError hierarchy', () => {
  it('BadRequestError tiene statusCode 400', () => {
    const e = new BadRequestError('bad');
    expect(e.statusCode).toBe(400);
    expect(e.code).toBe('BAD_REQUEST');
    expect(e).toBeInstanceOf(AppError);
  });

  it('NotFoundError tiene statusCode 404', () => {
    const e = new NotFoundError();
    expect(e.statusCode).toBe(404);
    expect(e.code).toBe('NOT_FOUND');
  });

  it('preserva el stack trace', () => {
    const e = new BadRequestError('x');
    expect(e.stack).toBeDefined();
  });
});
