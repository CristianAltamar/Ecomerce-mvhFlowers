import type { Request, Response } from 'express';
import { adminCouponsService } from './admin-coupons.service';
import { sendSuccess, sendCreated } from '../../lib/http';
import { asyncHandler } from '../../lib/async-handler';
import type { CreateCouponInput, UpdateCouponInput, AdminCouponsQuery } from './admin.schemas';

type ReqWithId = Request<{ id: string }>;

export const adminCouponsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await adminCouponsService.list(req.query as unknown as AdminCouponsQuery);
    sendSuccess(res, result);
  }),

  getById: asyncHandler(async (req: ReqWithId, res: Response) => {
    const coupon = await adminCouponsService.getById(req.params.id);
    sendSuccess(res, coupon);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const coupon = await adminCouponsService.create(req.body as CreateCouponInput);
    sendCreated(res, coupon);
  }),

  update: asyncHandler(async (req: ReqWithId, res: Response) => {
    const coupon = await adminCouponsService.update(req.params.id, req.body as UpdateCouponInput);
    sendSuccess(res, coupon);
  }),

  toggleActive: asyncHandler(async (req: ReqWithId, res: Response) => {
    const coupon = await adminCouponsService.toggleActive(req.params.id);
    sendSuccess(res, coupon);
  }),

  remove: asyncHandler(async (req: ReqWithId, res: Response) => {
    await adminCouponsService.remove(req.params.id);
    sendSuccess(res, { message: 'Cupón eliminado' });
  }),
};