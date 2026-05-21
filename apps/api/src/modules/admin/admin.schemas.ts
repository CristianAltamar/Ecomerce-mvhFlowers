import { z } from 'zod';

// ─── Products ────────────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  description: z.string().max(5000).optional(),
  shortDescription: z.string().max(500).optional(),
  priceCents: z.number().int().min(0),
  compareAtPriceCents: z.number().int().min(0).nullable().optional(),
  categoryId: z.string().nullable().optional(),
  stock: z.number().int().min(0).default(0),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().max(200).optional(),
  position: z.number().int().min(0).default(0),
});

export const productVariantSchema = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  priceCents: z.number().int().min(0),
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
