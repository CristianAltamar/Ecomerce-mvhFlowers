import type { RequestHandler } from 'express';
import { ZodError, type ZodType} from 'zod';

type Source = 'body' | 'query' | 'params';

/**
 * Middleware que valida una sección del request usando un schema Zod.
 * Asigna el resultado parseado de vuelta a req[source] para tipado downstream.
 *
 * @example
 *   router.post('/login', validate(loginSchema, 'body'), loginHandler)
 */
export function validate(schema: ZodType, source: Source = 'body'): RequestHandler {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      // Reescribimos el source con los valores parseados/transformados.
      // Para query y params, Express los tipa como ParsedQs/ParamsDictionary;
      // hacemos cast porque sabemos que el schema valida.
      if (source === 'query') {
        res.locals.validatedQuery = parsed;
      } else if (source === 'params') {
        res.locals.validatedParams = parsed;
      } else {
        req.body = parsed;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(err);
      }
      next(err);
    }
  };
}
