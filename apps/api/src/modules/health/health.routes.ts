import { Router, type Request, type Response } from 'express';
import { prisma } from '../../config/prisma';
import { asyncHandler } from '../../lib/async-handler';

const router: Router = Router();

/**
 * GET /health
 * Healthcheck básico. Verifica conexión a base de datos.
 * Útil para load balancers y orquestadores (Docker, k8s).
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const checks: Record<string, 'ok' | 'error'> = { server: 'ok' };

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }

    const allOk = Object.values(checks).every((v) => v === 'ok');
    res.status(allOk ? 200 : 503).json({
      ok: allOk,
      data: {
        status: allOk ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks,
      },
    });
  }),
);

export const healthRouter = router;
