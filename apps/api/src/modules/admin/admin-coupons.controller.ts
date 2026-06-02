import type { Request, Response } from 'express';
import { adminCouponsService } from './admin-coupons.service';
import { sendSuccess, sendCreated } from '../../lib/http';
import { asyncHandler } from '../../lib/async-handler';
import type { CreateCouponInput, UpdateCouponInput, AdminCouponsQuery } from './admin.schemas';

export const adminCouponsController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const query = res.locals.validatedQuery as AdminCouponsQuery;
    const result = await adminCouponsService.list(query);
    sendSuccess(res, result);
  }),

  getById: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = res.locals.validatedParams as { id: string };
    const coupon = await adminCouponsService.getById(id);
    sendSuccess(res, coupon);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const coupon = await adminCouponsService.create(req.body as CreateCouponInput);
    sendCreated(res, coupon);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { id } = res.locals.validatedParams as { id: string };
    const coupon = await adminCouponsService.update(id, req.body as UpdateCouponInput);
    sendSuccess(res, coupon);
  }),

  toggleActive: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = res.locals.validatedParams as { id: string };
    const coupon = await adminCouponsService.toggleActive(id);
    sendSuccess(res, coupon);
  }),

  remove: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = res.locals.validatedParams as { id: string };
    await adminCouponsService.remove(id);
    sendSuccess(res, { message: 'Cupón eliminado' });
  }),
};