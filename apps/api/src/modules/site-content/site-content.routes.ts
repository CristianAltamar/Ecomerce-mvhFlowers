/**
 * GET  /site-content/:key   — lectura pública (políticas, FAQ, privacidad)
 * PUT  /admin/site-content/:key — escritura solo admin (montado en admin.routes)
 */
import { Router, type Request, type Response } from 'express';
import { prisma } from '../../config/prisma';
import { sendSuccess } from '../../lib/http';
import { asyncHandler } from '../../lib/async-handler';

const router: Router = Router();

const ALLOWED_KEYS = ['politicas', 'faq', 'privacidad', 'theme'] as const;
type ContentKey = (typeof ALLOWED_KEYS)[number];

const DEFAULTS: Record<ContentKey, string> = {
  politicas:  '',
  faq:        '',
  privacidad: '',
  theme:      '',
};

router.get(
  '/:key',
  asyncHandler(async (req: Request, res: Response) => {
    const key = req.params.key as ContentKey;
    if (!ALLOWED_KEYS.includes(key)) {
      res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Clave no encontrada' } });
      return;
    }

    const row = await prisma.siteContent.findUnique({ where: { key } });
    sendSuccess(res, { key, content: row?.content ?? DEFAULTS[key] });
  }),
);

export const siteContentRouter = router;
