import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Envuelve un controller async para que sus rejections pasen al error handler
 * sin tener que escribir try/catch en cada handler.
 *
 * @example
 *   router.get('/products', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler =
  <T extends Request = Request>(
    fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>,
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };
