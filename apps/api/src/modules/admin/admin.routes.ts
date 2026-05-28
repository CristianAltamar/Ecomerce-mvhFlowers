import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { sendSuccess } from '../../lib/http';
import { asyncHandler } from '../../lib/async-handler';
import { adminProductsController } from './admin-products.controller';
import { adminCategoriesController } from './admin-categories.controller';
import { adminOrdersController } from './admin-orders.controller';
import { adminMetricsController } from './admin-metrics.controller';
import { adminCouponsController } from './admin-coupons.controller';
import { adminDeliveryController } from './admin-delivery.controller';
import { adminMediaController } from './admin-media.controller';

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  },
});
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
  createCouponSchema,
  updateCouponSchema,
  adminCouponsQuerySchema,
  createZoneSchema,
  updateZoneSchema,
  createSlotSchema,
  updateSlotSchema,
  createBlockedDateSchema,
} from './admin.schemas';

export const adminRouter = Router();

// All admin routes require auth + ADMIN or STAFF role
adminRouter.use(requireAuth, requireRole('ADMIN', 'STAFF'));

// ─── Media library ────────────────────────────────────────────────────────────
adminRouter.get('/media', adminMediaController.list);
adminRouter.post('/media/upload', imageUpload.single('file'), adminMediaController.upload);
adminRouter.delete('/media/:id', validate(idParamsSchema, 'params'), adminMediaController.remove);

// ─── Metrics ─────────────────────────────────────────────────────────────────
adminRouter.get('/metrics', adminMetricsController.getDashboard);

// ─── Products ─────────────────────────────────────────────────────────────────
adminRouter.get('/products', validate(adminProductsQuerySchema, 'query'), adminProductsController.list);
adminRouter.post('/products', validate(createProductSchema), adminProductsController.create);
adminRouter.get('/products/:id', validate(idParamsSchema, 'params'), adminProductsController.getById);
adminRouter.put('/products/:id', validate(idParamsSchema, 'params'), validate(updateProductSchema), adminProductsController.update);
adminRouter.patch('/products/:id/toggle-active', validate(idParamsSchema, 'params'), adminProductsController.toggleActive);

// Images
adminRouter.post('/products/:id/images', validate(idParamsSchema, 'params'), validate(productImageSchema), adminProductsController.addImage);
adminRouter.delete('/products/:id/images/:imageId', validate(productImageParamsSchema, 'params'), adminProductsController.deleteImage);

// Variants
adminRouter.post('/products/:id/variants', validate(idParamsSchema, 'params'), validate(productVariantSchema), adminProductsController.addVariant);
adminRouter.put('/products/:id/variants/:variantId', validate(variantParamsSchema, 'params'), validate(updateVariantSchema), adminProductsController.updateVariant);
adminRouter.delete('/products/:id/variants/:variantId', validate(variantParamsSchema, 'params'), adminProductsController.deleteVariant);

// ─── Categories ───────────────────────────────────────────────────────────────
adminRouter.get('/categories', adminCategoriesController.list);
adminRouter.post('/categories', validate(createCategorySchema), adminCategoriesController.create);
adminRouter.get('/categories/:id', validate(idParamsSchema, 'params'), adminCategoriesController.getById);
adminRouter.put('/categories/:id', validate(idParamsSchema, 'params'), validate(updateCategorySchema), adminCategoriesController.update);
adminRouter.patch('/categories/:id/toggle-active', validate(idParamsSchema, 'params'), adminCategoriesController.toggleActive);

// ─── Orders ───────────────────────────────────────────────────────────────────
adminRouter.get('/orders', validate(adminOrdersQuerySchema, 'query'), adminOrdersController.list);
adminRouter.get('/orders/:id', validate(idParamsSchema, 'params'), adminOrdersController.getById);
adminRouter.patch('/orders/:id/status', validate(idParamsSchema, 'params'), validate(updateOrderStatusSchema), adminOrdersController.updateStatus);

// ─── Coupons ─────────────────────────────────────────────────────────────────
adminRouter.get('/coupons', validate(adminCouponsQuerySchema, 'query'), adminCouponsController.list);
adminRouter.post('/coupons', validate(createCouponSchema), adminCouponsController.create);
adminRouter.get('/coupons/:id', validate(idParamsSchema, 'params'), adminCouponsController.getById);
adminRouter.put('/coupons/:id', validate(idParamsSchema, 'params'), validate(updateCouponSchema), adminCouponsController.update);
adminRouter.patch('/coupons/:id/toggle-active', validate(idParamsSchema, 'params'), adminCouponsController.toggleActive);
adminRouter.delete('/coupons/:id', validate(idParamsSchema, 'params'), adminCouponsController.remove);

// ─── Delivery config ──────────────────────────────────────────────────────────
// Zones
adminRouter.get('/delivery/zones', adminDeliveryController.listZones);
adminRouter.post('/delivery/zones', validate(createZoneSchema), adminDeliveryController.createZone);
adminRouter.put('/delivery/zones/:id', validate(idParamsSchema, 'params'), validate(updateZoneSchema), adminDeliveryController.updateZone);
adminRouter.patch('/delivery/zones/:id/toggle-active', validate(idParamsSchema, 'params'), adminDeliveryController.toggleZone);
adminRouter.delete('/delivery/zones/:id', validate(idParamsSchema, 'params'), adminDeliveryController.deleteZone);

// Slots
adminRouter.get('/delivery/slots', adminDeliveryController.listSlots);
adminRouter.post('/delivery/slots', validate(createSlotSchema), adminDeliveryController.createSlot);
adminRouter.put('/delivery/slots/:id', validate(idParamsSchema, 'params'), validate(updateSlotSchema), adminDeliveryController.updateSlot);
adminRouter.patch('/delivery/slots/:id/toggle-active', validate(idParamsSchema, 'params'), adminDeliveryController.toggleSlot);
adminRouter.delete('/delivery/slots/:id', validate(idParamsSchema, 'params'), adminDeliveryController.deleteSlot);

// Blocked dates
adminRouter.get('/delivery/blocked-dates', adminDeliveryController.listBlockedDates);
adminRouter.post('/delivery/blocked-dates', validate(createBlockedDateSchema), adminDeliveryController.blockDate);
adminRouter.delete('/delivery/blocked-dates/:id', validate(idParamsSchema, 'params'), adminDeliveryController.unblockDate);

// ─── Site content (políticas, FAQ, privacidad, theme) ────────────────────────
const siteContentSchema = z.object({ content: z.string().max(50_000) });
const CONTENT_KEYS = ['politicas', 'faq', 'privacidad', 'theme'] as const;

adminRouter.put(
  '/site-content/:key',
  validate(z.object({ key: z.enum(CONTENT_KEYS) }), 'params'),
  validate(siteContentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params as { key: typeof CONTENT_KEYS[number] };
    const { content } = req.body as { content: string };
    const row = await prisma.siteContent.upsert({
      where: { key },
      update: { content },
      create: { key, content },
    });
    sendSuccess(res, row);
  }),
);