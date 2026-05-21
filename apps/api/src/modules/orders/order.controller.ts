import type { Request, Response } from 'express';
import { orderService } from './order.service';
import { sendSuccess, sendCreated } from '../../lib/http';
import { asyncHandler } from '../../lib/async-handler';
import type { AuthenticatedRequest } from '../../middlewares/auth';
import type { CreateOrderInput, ListOrdersQuery } from './order.schemas';

type ReqWithId = Request<{ id: string }>;

export const orderController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.sub;
    const order = await orderService.create(req.body as CreateOrderInput, userId);
    sendCreated(res, order);
  }),

  list: asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
    const result = await orderService.list(req.user.sub, req.query as unknown as ListOrdersQuery);
    sendSuccess(res, result);
  }),

  getById: asyncHandler(async (req: ReqWithId, res: Response) => {
    const userId = (req as unknown as AuthenticatedRequest).user?.sub;
    const order = await orderService.getById(req.params.id, userId);
    sendSuccess(res, order);
  }),
};