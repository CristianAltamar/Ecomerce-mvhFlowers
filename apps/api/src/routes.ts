import { Router } from 'express';
import { authRouter } from './modules/auth/auth.routes';
import { productRouter } from './modules/products/product.routes';
import { categoryRouter } from './modules/categories/category.routes';
import { healthRouter } from './modules/health/health.routes';

const router: Router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/products', productRouter);
router.use('/categories', categoryRouter);

export const apiRouter = router;
