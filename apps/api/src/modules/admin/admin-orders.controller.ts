import type { Request, Response } from 'express';
import { adminOrdersService } from './admin-orders.service';
import { sendSuccess } from '../../lib/http';
import { asyncHandler } from '../../lib/async-handler';
import type { UpdateOrderStatusInput, AdminOrdersQuery } from './admin.schemas';

type ReqWithId = Request<{ id: string }>;

export const adminOrdersController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await adminOrdersService.list(req.query as unknown as AdminOrdersQuery);
    sendSuccess(res, result);
  }),

  getById: asyncHandler(async (req: ReqWithId, res: Response) => {
    const order = await adminOrdersService.getById(req.params.id);
    sendSuccess(res, order);
  }),

  updateStatus: asyncHandler(async (req: ReqWithId, res: Response) => {
    const order = await adminOrdersService.updateStatus(
      req.params.id,
      req.body as UpdateOrderStatusInput,
    );
    sendSuccess(res, order);
  }),
};
