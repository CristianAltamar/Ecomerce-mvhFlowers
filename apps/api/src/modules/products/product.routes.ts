import { Router } from 'express';
import { productController } from './product.controller';
import { listProductsQuerySchema, productSlugParamsSchema } from './product.schemas';
import { validate } from '../../middlewares/validate';

const router: Router = Router();

router.get('/', validate(listProductsQuerySchema, 'query'), productController.list);
router.get('/featured', productController.getFeatured);
router.get('/:slug', validate(productSlugParamsSchema, 'params'), productController.getBySlug);

export const productRouter = router;
