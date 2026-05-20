import type { RequestHandler } from 'express';
import { ZodError, type ZodSchema } from 'zod';

type Source = 'body' | 'query' | 'params';

/**
 * Middleware que valida una sección del request usando un schema Zod.
 * Asigna el resultado parseado de vuelta a req[source] para tipado downstream.
 *
 * @example
 *   router.post('/login', validate(loginSchema, 'body'), loginHandler)
 */
export function validate(schema: ZodSchema, source: Source = 'body'): RequestHandler {
  return (req, _res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      // Reescribimos el source con los valores parseados/transformados.
      // Para query y params, Express los tipa como ParsedQs/ParamsDictionary;
      // hacemos cast porque sabemos que el schema valida.
      (req as unknown as Record<Source, unknown>)[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(err);
      }
      next(err);
    }
  };
}
