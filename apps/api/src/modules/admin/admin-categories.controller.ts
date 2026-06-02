import type { Request, Response } from 'express';
import { adminCategoriesService } from './admin-categories.service';
import { sendSuccess, sendCreated } from '../../lib/http';
import { asyncHandler } from '../../lib/async-handler';
import type { CreateCategoryInput, UpdateCategoryInput } from './admin.schemas';

export const adminCategoriesController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const categories = await adminCategoriesService.list();
    sendSuccess(res, categories);
  }),

  getById: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = res.locals.validatedParams as { id: string };
    const category = await adminCategoriesService.getById(id);
    sendSuccess(res, category);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const category = await adminCategoriesService.create(req.body as CreateCategoryInput);
    sendCreated(res, category);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { id } = res.locals.validatedParams as { id: string };
    const category = await adminCategoriesService.update(id, req.body as UpdateCategoryInput);
    sendSuccess(res, category);
  }),

  toggleActive: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = res.locals.validatedParams as { id: string };
    const category = await adminCategoriesService.toggleActive(id);
    sendSuccess(res, category);
  }),
};
