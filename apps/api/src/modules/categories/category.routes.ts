import { Router, type Request, type Response } from 'express';
import { prisma } from '../../config/prisma';
import { sendSuccess } from '../../lib/http';
import { asyncHandler } from '../../lib/async-handler';
import { NotFoundError } from '../../lib/errors';

const router: Router = Router();

/**
 * GET /categories
 * Devuelve árbol completo de categorías activas (con hijos anidados).
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const roots = await prisma.category.findMany({
      where: { isActive: true, parentId: null },
      include: {
        children: {
          where: { isActive: true },
          include: { children: { where: { isActive: true } } },
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { position: 'asc' },
    });
    sendSuccess(res, roots);
  }),
);

/**
 * GET /categories/:slug
 * Devuelve una categoría con sus hijos directos.
 */
router.get(
  '/:slug',
  asyncHandler(async (req: Request, res: Response) => {
    const cat = await prisma.category.findFirst({
      where: { slug: req.params.slug, isActive: true },
      include: {
        children: { where: { isActive: true }, orderBy: { position: 'asc' } },
        parent: { select: { id: true, slug: true, name: true } },
      },
    });
    if (!cat) throw new NotFoundError(`Categoría "${req.params.slug}" no encontrada`);
    sendSuccess(res, cat);
  }),
);

export const categoryRouter = router;
