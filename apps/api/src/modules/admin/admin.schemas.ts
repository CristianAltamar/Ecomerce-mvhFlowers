import { z } from 'zod';

// ─── Products ────────────────────────────────────────────────────────────────

const productBaseSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  description: z.string().max(5000).optional(),
  shortDescription: z.string().max(500).optional(),
  // price es el precio base en pesos (COP). El descuento se aplica sobre él.
  price: z.number().int().positive(),
  discountType: z.enum(['PERCENT', 'FIXED']).nullable().optional(),
  discountValue: z.number().int().min(0).nullable().optional(),
  categoryId: z.string().nullable().optional(),
  stock: z.number().int().min(0).default(0),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
});

// Valida que el descuento sea coherente y no deje el precio en 0 o menos.
function validateDiscount(
  data: { price?: number; discountType?: 'PERCENT' | 'FIXED' | null; discountValue?: number | null },
  ctx: z.RefinementCtx,
) {
  const { price, discountType, discountValue } = data;
  if (!discountType) return; // sin descuento, nada que validar
  if (discountValue === null || discountValue === undefined || discountValue <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['discountValue'], message: 'Ingresa un valor de descuento mayor a 0.' });
    return;
  }
  if (price === undefined) return; // en updates parciales sin precio, se valida en el servicio
  if (discountType === 'PERCENT') {
    if (discountValue >= 100) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['discountValue'], message: 'El porcentaje debe ser menor a 100%.' });
    }
  } else if (discountValue >= price) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['discountValue'], message: 'El descuento no puede ser mayor o igual al precio.' });
  }
}

export const createProductSchema = productBaseSchema.superRefine(validateDiscount);

export const updateProductSchema = productBaseSchema.partial().superRefine(validateDiscount);

export const productImageSchema = z.object({
  mediaId: z.string().min(1),
  alt: z.string().max(200).optional(),
  position: z.number().int().min(0).default(0),
});

// ─── Media ───────────────────────────────────────────────────────────────────

export const updateMediaSchema = z.object({
  filename: z.string().min(1).max(200).optional(),
  alt: z.string().max(300).nullable().optional(),
});

export const productVariantSchema = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  price: z.number().int().min(0),
  stock: z.number().int().min(0).default(0),
  isDefault: z.boolean().default(false),
});

export const updateVariantSchema = productVariantSchema.partial();

// ─── Categories ───────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional().nullable(),
  parentId: z.string().nullable().optional(),
  position: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

// ─── Orders ───────────────────────────────────────────────────────────────────

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
  note: z.string().max(500).optional(),
});

export const adminOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum(['PENDING', 'PAID', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'])
    .optional(),
  search: z.string().optional(),
});

export const adminProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

// ─── Param schemas ────────────────────────────────────────────────────────────

export const idParamsSchema = z.object({ id: z.string().min(1) });
export const productImageParamsSchema = z.object({ id: z.string(), imageId: z.string() });
export const variantParamsSchema = z.object({ id: z.string(), variantId: z.string() });

// ─── Coupons ─────────────────────────────────────────────────────────────────

export const createCouponSchema = z.object({
  code: z.string().min(3).max(30).toUpperCase(),
  description: z.string().max(300).optional(),
  type: z.enum(['PERCENT', 'FIXED']),
  value: z.number().int().positive(),
  minPurchase: z.number().int().min(0).default(0),
  maxDiscount: z.number().int().positive().nullable().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  perUserLimit: z.number().int().positive().nullable().optional(),
  startsAt: z.string().datetime({ offset: true }).nullable().optional(),
  expiresAt: z.string().datetime({ offset: true }).nullable().optional(),
  isActive: z.boolean().default(true),
});

export const updateCouponSchema = createCouponSchema.partial();

export const adminCouponsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

// ─── Delivery config ──────────────────────────────────────────────────────────

export const createZoneSchema = z.object({
  name: z.string().min(2).max(100),
  fee: z.number().int().min(0),
  description: z.string().max(300).optional(),
  neighborhoods: z.array(z.string().min(1)).min(1),
  isActive: z.boolean().default(true),
});

export const updateZoneSchema = createZoneSchema.partial();

export const createSlotSchema = z.object({
  label: z.string().min(2).max(100),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  position: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateSlotSchema = createSlotSchema.partial();

export const createBlockedDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  reason: z.string().max(200).optional(),
});

export const slotParamsSchema = z.object({ id: z.string().min(1) });
export const blockedDateParamsSchema = z.object({ id: z.string().min(1) });

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductImageInput = z.infer<typeof productImageSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type AdminOrdersQuery = z.infer<typeof adminOrdersQuerySchema>;
export type AdminProductsQuery = z.infer<typeof adminProductsQuerySchema>;
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type AdminCouponsQuery = z.infer<typeof adminCouponsQuerySchema>;
export type CreateZoneInput = z.infer<typeof createZoneSchema>;
export type UpdateZoneInput = z.infer<typeof updateZoneSchema>;
export type CreateSlotInput = z.infer<typeof createSlotSchema>;
export type UpdateSlotInput = z.infer<typeof updateSlotSchema>;
export type CreateBlockedDateInput = z.infer<typeof createBlockedDateSchema>;
