import type { Response } from 'express';

/**
 * Helpers para enviar respuestas con estructura uniforme:
 *   { ok: true, data: ... }   o   { ok: false, error: { code, message, details } }
 */

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): Response {
  return res.status(statusCode).json({ ok: true, data });
}

export function sendCreated<T>(res: Response, data: T): Response {
  return sendSuccess(res, data, 201);
}

export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): Response {
  return res.status(statusCode).json({
    ok: false,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  });
}
