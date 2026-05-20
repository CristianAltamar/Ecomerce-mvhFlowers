import type { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../lib/errors';
import { sendError } from '../lib/http';
import { logger } from '../config/logger';
import { isProduction } from '../config/env';

/**
 * Middleware central que convierte cualquier error en una respuesta JSON consistente.
 * Mapea errores conocidos (Zod, Prisma, AppError) y envía 500 genérico para el resto.
 */
export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) => {
  // 1. Errores tipados de la app
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  // 2. Errores de validación Zod
  if (err instanceof ZodError) {
    return sendError(res, 422, 'VALIDATION_ERROR', 'Datos inválidos', err.flatten().fieldErrors);
  }

  // 3. Errores conocidos de Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'campo';
      return sendError(res, 409, 'CONFLICT', `Ya existe un registro con ese ${target}`);
    }
    if (err.code === 'P2025') {
      return sendError(res, 404, 'NOT_FOUND', 'Recurso no encontrado');
    }
    if (err.code === 'P2003') {
      return sendError(res, 400, 'BAD_REQUEST', 'Referencia inválida (foreign key)');
    }
  }

  // 4. Cualquier otro error → 500
  const message = err instanceof Error ? err.message : 'Error desconocido';
  logger.error(
    { err, path: req.path, method: req.method },
    `Unhandled error: ${message}`,
  );

  return sendError(
    res,
    500,
    'INTERNAL_ERROR',
    isProduction ? 'Error interno del servidor' : message,
  );
};
