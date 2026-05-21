import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { adminProductsController } from './admin-products.controller';
import { adminCategoriesController } from './admin-categories.controller';
import { adminOrdersController } from './admin-orders.controller';
import { adminMetricsController } from './admin-metrics.controller';
import {
  createProductSchema,
  updateProductSchema,
  productImageSchema,
  productVariantSchema,
  updateVariantSchema,
  createCategorySchema,
  updateCategorySchema,
  updateOrderStatusSchema,
  adminOrdersQuerySchema,
  adminProductsQuerySchema,
  idParamsSchema,
  productImageParamsSchema,
  variantParamsSchema,
} from './admin.schemas';

export const adminRouter = Router();

// All admin routes require auth + ADMIN or STAFF role
adminRouter.use(requireAuth, requireRole('ADMIN', 'STAFF'));

// ─── Metrics ─────────────────────────────────────────────────────────────────
adminRouter.get('/metrics', adminMetricsController.getDashboard);

// ─── Products ─────────────────────────────────────────────────────────────────
adminRouter.get(
  '/products',
  validate(adminProductsQuerySchema, 'query'),
  adminProductsController.list,
);
adminRouter.post(
  '/products',
  validate(createProductSchema),
  adminProductsController.create,
);
adminRouter.get(
  '/products/:id',
  validate(idParamsSchema, 'params'),
  adminProductsController.getById,
);
adminRouter.put(
  '/products/:id',
  validate(idParamsSchema, 'params'),
  validate(updateProductSchema),
  adminProductsController.update,
);
adminRouter.patch(
  '/products/:id/toggle-active',
  validate(idParamsSchema, 'params'),
  adminProductsController.toggleActive,
);

// Images
adminRouter.post(
  '/products/:id/images',
  validate(idParamsSchema, 'params'),
  validate(productImageSchema),
  adminProductsController.addImage,
);
adminRouter.delete(
  '/products/:id/images/:imageId',
  validate(productImageParamsSchema, 'params'),
  adminProductsController.deleteImage,
);

// Variants
adminRouter.post(
  '/products/:id/variants',
  validate(idParamsSchema, 'params'),
  validate(productVariantSchema),
  adminProductsController.addVariant,
);
adminRouter.put(
  '/products/:id/variants/:variantId',
  validate(variantParamsSchema, 'params'),
  validate(updateVariantSchema),
  adminProductsController.updateVariant,
);
adminRouter.delete(
  '/products/:id/variants/:variantId',
  validate(variantParamsSchema, 'params'),
  adminProductsController.deleteVariant,
);

// ─── Categories ───────────────────────────────────────────────────────────────
adminRouter.get('/categories', adminCategoriesController.list);
adminRouter.post(
  '/categories',
  validate(createCategorySchema),
  adminCategoriesController.create,
);
adminRouter.get(
  '/categories/:id',
  validate(idParamsSchema, 'params'),
  adminCategoriesController.getById,
);
adminRouter.put(
  '/categories/:id',
  validate(idParamsSchema, 'params'),
  validate(updateCategorySchema),
  adminCategoriesController.update,
);
adminRouter.patch(
  '/categories/:id/toggle-active',
  validate(idParamsSchema, 'params'),
  adminCategoriesController.toggleActive,
);

// ─── Orders ───────────────────────────────────────────────────────────────────
adminRouter.get(
  '/orders',
  validate(adminOrdersQuerySchema, 'query'),
  adminOrdersController.list,
);
adminRouter.get(
  '/orders/:id',
  validate(idParamsSchema, 'params'),
  adminOrdersController.getById,
);
adminRouter.patch(
  '/orders/:id/status',
  validate(idParamsSchema, 'params'),
  validate(updateOrderStatusSchema),
  adminOrdersController.updateStatus,
);
