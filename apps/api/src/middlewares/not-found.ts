import type { RequestHandler } from 'express';
import { sendError } from '../lib/http';

export const notFoundHandler: RequestHandler = (req, res) => {
  sendError(res, 404, 'NOT_FOUND', `Ruta no encontrada: ${req.method} ${req.path}`);
};
