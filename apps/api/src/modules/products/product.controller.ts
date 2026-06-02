import type { Request, Response } from 'express';
import { productService } from './product.service';
import { sendSuccess } from '../../lib/http';
import { asyncHandler } from '../../lib/async-handler';
import type { ListProductsQuery } from './product.schemas';

export const productController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const query = res.locals.validatedQuery as ListProductsQuery;
    const result = await productService.list(query);
    sendSuccess(res, result);
  }),

  getBySlug: asyncHandler(async (_req: Request<{ slug: string }>, res: Response) => {
    const slug = res.locals.validatedParams?.slug;
    if (!slug) {
      sendSuccess(res, null, 400);
      return;
    }
    const product = await productService.getBySlug(slug);
    sendSuccess(res, product);
  }),

  getFeatured: asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 8));
    const products = await productService.getFeatured(limit);
    sendSuccess(res, products);
  }),
};
