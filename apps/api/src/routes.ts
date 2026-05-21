import { Router } from 'express';
import { authRouter } from './modules/auth/auth.routes';
import { productRouter } from './modules/products/product.routes';
import { categoryRouter } from './modules/categories/category.routes';
import { healthRouter } from './modules/health/health.routes';
import { addressRouter } from './modules/addresses/address.routes';
import { deliveryRouter } from './modules/delivery/delivery.routes';
import { couponRouter } from './modules/coupons/coupon.routes';
import { orderRouter } from './modules/orders/order.routes';
import { paymentRouter } from './modules/payments/payment.routes';
import { adminRouter } from './modules/admin/admin.routes';

const router: Router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/products', productRouter);
router.use('/categories', categoryRouter);
router.use('/addresses', addressRouter);
router.use('/delivery', deliveryRouter);
router.use('/coupons', couponRouter);
router.use('/orders', orderRouter);
router.use('/', paymentRouter); // monta /orders/:id/pay y /payments/webhooks/bold
router.use('/admin', adminRouter);

export const apiRouter = router;
