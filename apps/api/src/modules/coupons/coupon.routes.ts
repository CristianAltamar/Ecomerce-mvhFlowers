import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { couponController } from './coupon.controller';
import { validateCouponSchema } from './coupon.schemas';

export const couponRouter: Router = Router();

couponRouter.post('/validate', validate(validateCouponSchema), couponController.validate);