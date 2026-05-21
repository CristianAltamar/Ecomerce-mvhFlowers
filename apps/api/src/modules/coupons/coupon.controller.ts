import type { Request, Response } from 'express';
import { couponService } from './coupon.service';
import { sendSuccess } from '../../lib/http';
import { asyncHandler } from '../../lib/async-handler';
import type { ValidateCouponInput } from './coupon.schemas';

export const couponController = {
  validate: asyncHandler(async (req: Request, res: Response) => {
    const { code, subtotalCents } = req.body as ValidateCouponInput;
    const result = await couponService.validate(code, subtotalCents);
    sendSuccess(res, result);
  }),
};