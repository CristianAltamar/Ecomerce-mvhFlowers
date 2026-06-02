import type { Request, Response } from 'express';
import { adminOrdersService } from './admin-orders.service';
import { sendSuccess } from '../../lib/http';
import { asyncHandler } from '../../lib/async-handler';
import type { UpdateOrderStatusInput, AdminOrdersQuery } from './admin.schemas';

export const adminOrdersController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const query = res.locals.validatedQuery as AdminOrdersQuery;
    const result = await adminOrdersService.list(query);
    sendSuccess(res, result);
  }),

  getById: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = res.locals.validatedParams as { id: string };
    const order = await adminOrdersService.getById(id);
    sendSuccess(res, order);
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const { id } = res.locals.validatedParams as { id: string };
    const order = await adminOrdersService.updateStatus(id, req.body as UpdateOrderStatusInput);
    sendSuccess(res, order);
  }),
};
