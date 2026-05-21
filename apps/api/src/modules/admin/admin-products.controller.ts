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

type ReqWithId = Request<{ id: string }>;
type ReqWithProductImage = Request<{ id: string; imageId: string }>;
type ReqWithVariant = Request<{ id: string; variantId: string }>;

export const adminProductsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await adminProductsService.list(req.query as unknown as AdminProductsQuery);
    sendSuccess(res, result);
  }),

  getById: asyncHandler(async (req: ReqWithId, res: Response) => {
    const product = await adminProductsService.getById(req.params.id);
    sendSuccess(res, product);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const product = await adminProductsService.create(req.body as CreateProductInput);
    sendCreated(res, product);
  }),

  update: asyncHandler(async (req: ReqWithId, res: Response) => {
    const product = await adminProductsService.update(req.params.id, req.body as UpdateProductInput);
    sendSuccess(res, product);
  }),

  toggleActive: asyncHandler(async (req: ReqWithId, res: Response) => {
    const product = await adminProductsService.toggleActive(req.params.id);
    sendSuccess(res, product);
  }),

  addImage: asyncHandler(async (req: ReqWithId, res: Response) => {
    const image = await adminProductsService.addImage(req.params.id, req.body as ProductImageInput);
    sendCreated(res, image);
  }),

  deleteImage: asyncHandler(async (req: ReqWithProductImage, res: Response) => {
    await adminProductsService.deleteImage(req.params.id, req.params.imageId);
    sendNoContent(res);
  }),

  addVariant: asyncHandler(async (req: ReqWithId, res: Response) => {
    const variant = await adminProductsService.addVariant(req.params.id, req.body as ProductVariantInput);
    sendCreated(res, variant);
  }),

  updateVariant: asyncHandler(async (req: ReqWithVariant, res: Response) => {
    const variant = await adminProductsService.updateVariant(
      req.params.id,
      req.params.variantId,
      req.body as UpdateVariantInput,
    );
    sendSuccess(res, variant);
  }),

  deleteVariant: asyncHandler(async (req: ReqWithVariant, res: Response) => {
    await adminProductsService.deleteVariant(req.params.id, req.params.variantId);
    sendNoContent(res);
  }),
};
