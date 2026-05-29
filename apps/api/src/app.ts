import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { apiRouter } from './routes';
import { errorHandler } from './middlewares/error-handler';
import { notFoundHandler } from './middlewares/not-found';
import { generalLimiter } from './middlewares/rate-limit';

export function createApp(): Application {
  const app = express();

  // Permite que express.Request.ip respete X-Forwarded-For cuando hay reverse proxy (Nginx)
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // === SEGURIDAD ===
  app.use(
    helmet({
      contentSecurityPolicy: false, // CSP se gestiona desde el frontend
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    cors({
      origin: (origin, callback) => {
        // Permite Postman, curl (sin origin) y orígenes de la lista
        if (!origin || env.CORS_ORIGINS.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origen no permitido: ${origin}`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // === MIDDLEWARES ===
  app.use(compression());
  // Captura el body crudo en req.rawBody para verificar la firma HMAC del webhook de Bold
  // (la firma debe calcularse sobre los bytes exactos recibidos, no sobre el JSON re-serializado).
  app.use(
    express.json({
      limit: '1mb',
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  // Logging HTTP estructurado
  app.use(
    pinoHttp({
      logger,
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      autoLogging: { ignore: (req) => req.url === '/api/v1/health' },
    }),
  );

  // Rate limiter general (auth tiene su propio limiter más estricto)
  app.use(generalLimiter);

  // === RUTAS ===
  // Endpoint raíz simple para identificación
  app.get('/', (_req, res) => {
    res.json({
      ok: true,
      data: {
        name: 'MVH Flores API',
        version: '0.1.0',
        env: env.NODE_ENV,
        docs: `${env.API_BASE_URL}/docs`,
      },
    });
  });

  app.use('/api/v1', apiRouter);

  // 404 + error handler
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
