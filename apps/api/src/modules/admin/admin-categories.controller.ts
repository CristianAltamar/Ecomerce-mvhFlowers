import type { Request, Response } from 'express';
import { adminCategoriesService } from './admin-categories.service';
import { sendSuccess, sendCreated } from '../../lib/http';
import { asyncHandler } from '../../lib/async-handler';
import type { CreateCategoryInput, UpdateCategoryInput } from './admin.schemas';

type ReqWithId = Request<{ id: string }>;

export const adminCategoriesController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const categories = await adminCategoriesService.list();
    sendSuccess(res, categories);
  }),

  getById: asyncHandler(async (req: ReqWithId, res: Response) => {
    const category = await adminCategoriesService.getById(req.params.id);
    sendSuccess(res, category);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const category = await adminCategoriesService.create(req.body as CreateCategoryInput);
    sendCreated(res, category);
  }),

  update: asyncHandler(async (req: ReqWithId, res: Response) => {
    const category = await adminCategoriesService.update(
      req.params.id,
      req.body as UpdateCategoryInput,
    );
    sendSuccess(res, category);
  }),

  toggleActive: asyncHandler(async (req: ReqWithId, res: Response) => {
    const category = await adminCategoriesService.toggleActive(req.params.id);
    sendSuccess(res, category);
  }),
};
