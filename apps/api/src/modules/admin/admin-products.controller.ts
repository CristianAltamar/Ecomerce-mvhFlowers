import type { Request, Response } from 'express';
import { adminProductsService } from './admin-products.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../lib/http';
import { asyncHandler } from '../../lib/async-handler';
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductImageInput,
  ProductVariantInput,
  UpdateVariantInput,
  AdminProductsQuery,
} from './admin.schemas';

export const adminProductsController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const query = res.locals.validatedQuery as AdminProductsQuery;
    const result = await adminProductsService.list(query);
    sendSuccess(res, result);
  }),

  getById: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = res.locals.validatedParams as { id: string };
    const product = await adminProductsService.getById(id);
    sendSuccess(res, product);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const product = await adminProductsService.create(req.body as CreateProductInput);
    sendCreated(res, product);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { id } = res.locals.validatedParams as { id: string };
    const product = await adminProductsService.update(id, req.body as UpdateProductInput);
    sendSuccess(res, product);
  }),

  toggleActive: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = res.locals.validatedParams as { id: string };
    const product = await adminProductsService.toggleActive(id);
    sendSuccess(res, product);
  }),

  remove: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = res.locals.validatedParams as { id: string };
    await adminProductsService.remove(id);
    sendNoContent(res);
  }),

  addImage: asyncHandler(async (req: Request, res: Response) => {
    const { id } = res.locals.validatedParams as { id: string };
    const image = await adminProductsService.addImage(id, req.body as ProductImageInput);
    sendCreated(res, image);
  }),

  deleteImage: asyncHandler(async (_req: Request, res: Response) => {
    const { id, imageId } = res.locals.validatedParams as { id: string; imageId: string };
    await adminProductsService.deleteImage(id, imageId);
    sendNoContent(res);
  }),

  addVariant: asyncHandler(async (req: Request, res: Response) => {
    const { id } = res.locals.validatedParams as { id: string };
    const variant = await adminProductsService.addVariant(id, req.body as ProductVariantInput);
    sendCreated(res, variant);
  }),

  updateVariant: asyncHandler(async (req: Request, res: Response) => {
    const { id, variantId } = res.locals.validatedParams as { id: string; variantId: string };
    const variant = await adminProductsService.updateVariant(id, variantId, req.body as UpdateVariantInput);
    sendSuccess(res, variant);
  }),

  deleteVariant: asyncHandler(async (_req: Request, res: Response) => {
    const { id, variantId } = res.locals.validatedParams as { id: string; variantId: string };
    await adminProductsService.deleteVariant(id, variantId);
    sendNoContent(res);
  }),
};
