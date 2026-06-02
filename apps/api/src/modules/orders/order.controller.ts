import type { Request, Response } from 'express';
import { orderService } from './order.service';
import { sendSuccess, sendCreated } from '../../lib/http';
import { asyncHandler } from '../../lib/async-handler';
import type { AuthenticatedRequest } from '../../middlewares/auth';
import type { CreateOrderInput, ListOrdersQuery } from './order.schemas';

export const orderController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.sub;
    const order = await orderService.create(req.body as CreateOrderInput, userId);
    sendCreated(res, order);
  }),

  list: asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
    const query = res.locals.validatedQuery as ListOrdersQuery;
    const result = await orderService.list(req.user.sub, query);
    sendSuccess(res, result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = res.locals.validatedParams as { id: string };
    const userId = (req as unknown as AuthenticatedRequest).user?.sub;
    const order = await orderService.getById(id, userId);
    sendSuccess(res, order);
  }),
};