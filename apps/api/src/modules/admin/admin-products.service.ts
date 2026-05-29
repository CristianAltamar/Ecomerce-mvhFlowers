import type { DiscountType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError, ConflictError, BadRequestError } from '../../lib/errors';
import { cache } from '../../lib/cache';
import { productImagesInclude, mapProduct } from '../products/product.mapper';
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductImageInput,
  ProductVariantInput,
  UpdateVariantInput,
  AdminProductsQuery,
} from './admin.schemas';

const PRODUCT_INCLUDE = {
  category: { select: { id: true, name: true, slug: true } },
  images: productImagesInclude,
  variants: { orderBy: { createdAt: 'asc' as const } },
  _count: { select: { orderItems: true } },
} as const;

/**
 * A partir del precio base + descuento, calcula el precio final de venta y el
 * "precio antes" (compareAtPrice). Si no hay descuento, no hay precio tachado.
 */
function computePricing(input: {
  price: number;
  discountType?: DiscountType | null;
  discountValue?: number | null;
}): { price: number; compareAtPrice: number | null; discountType: DiscountType | null; discountValue: number | null } {
  const base = input.price;
  const type = input.discountType ?? null;
  const value = input.discountValue ?? null;

  if (!type || value === null || value <= 0) {
    return { price: base, compareAtPrice: null, discountType: null, discountValue: null };
  }

  const final = type === 'PERCENT' ? Math.round(base * (1 - value / 100)) : base - value;
  if (final <= 0) {
    throw new BadRequestError('El descuento no puede dejar el precio en 0 o menos.');
  }
  return { price: final, compareAtPrice: base, discountType: type, discountValue: value };
}

export const adminProductsService = {
  async list(query: AdminProductsQuery) {
    const { page, perPage, search, categoryId, isActive } = query;
    const skip = (page - 1) * perPage;

    const where = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { slug: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.product.count({ where }),
    ]);

    return { data: data.map(mapProduct), meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) } };
  },

  async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE,
    });
    if (!product) throw new NotFoundError('Producto no encontrado');
    return mapProduct(product);
  },

  async create(data: CreateProductInput) {
    const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
    if (existing) throw new ConflictError(`El slug "${data.slug}" ya existe`);

    const pricing = computePricing(data);

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        shortDescription: data.shortDescription,
        price: pricing.price,
        compareAtPrice: pricing.compareAtPrice,
        discountType: pricing.discountType,
        discountValue: pricing.discountValue,
        categoryId: data.categoryId,
        stock: data.stock,
        isFeatured: data.isFeatured,
        isActive: data.isActive,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
      },
      include: PRODUCT_INCLUDE,
    });
    await cache.delPattern('products:*');
    return mapProduct(product);
  },

  async update(id: string, data: UpdateProductInput) {
    const existing = await this.getById(id);

    if (data.slug) {
      const conflict = await prisma.product.findFirst({
        where: { slug: data.slug, NOT: { id } },
      });
      if (conflict) throw new ConflictError(`El slug "${data.slug}" ya está en uso`);
    }

    // Si llega un precio nuevo, recalculamos precio final + compareAtPrice + descuento
    const { discountType: _dt, discountValue: _dv, ...rest } = data;
    const pricingData =
      data.price !== undefined
        ? computePricing({
            price: data.price,
            discountType: data.discountType ?? null,
            discountValue: data.discountValue ?? null,
          })
        : null;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...rest,
        ...(pricingData ?? {}),
      },
      include: PRODUCT_INCLUDE,
    });
    await cache.del(`products:slug:${existing.slug}`, 'products:featured:8');
    await cache.delPattern('products:list:*');
    return mapProduct(product);
  },

  async toggleActive(id: string) {
    const existing = await this.getById(id);
    const product = await prisma.product.update({
      where: { id },
      data: { isActive: !existing.isActive },
      include: PRODUCT_INCLUDE,
    });
    await cache.del(`products:slug:${existing.slug}`, 'products:featured:8');
    await cache.delPattern('products:list:*');
    return mapProduct(product);
  },

  async remove(id: string) {
    const existing = await prisma.product.findUnique({ where: { id }, select: { id: true, slug: true } });
    if (!existing) throw new NotFoundError('Producto no encontrado');
    // onDelete: Cascade borra imágenes/variantes; los OrderItem quedan con productId = null (SetNull)
    await prisma.product.delete({ where: { id } });
    await cache.del(`products:slug:${existing.slug}`, 'products:featured:8');
    await cache.delPattern('products:*');
  },

  // ─── Images ────────────────────────────────────────────────────────────────

  async addImage(productId: string, data: ProductImageInput) {
    await this.getById(productId);
    const media = await prisma.media.findUnique({ where: { id: data.mediaId } });
    if (!media) throw new NotFoundError('La imagen seleccionada no existe en la biblioteca');
    await prisma.productImage.create({
      data: { mediaId: data.mediaId, alt: data.alt, position: data.position, productId },
    });
    await cache.delPattern('products:*');
    return this.getById(productId);
  },

  async deleteImage(productId: string, imageId: string) {
    const image = await prisma.productImage.findFirst({ where: { id: imageId, productId } });
    if (!image) throw new NotFoundError('Imagen no encontrada');
    await prisma.productImage.delete({ where: { id: imageId } });
    await cache.delPattern('products:*');
  },

  // ─── Variants ──────────────────────────────────────────────────────────────

  async addVariant(productId: string, data: ProductVariantInput) {
    await this.getById(productId);

    const skuExists = await prisma.productVariant.findUnique({ where: { sku: data.sku } });
    if (skuExists) throw new ConflictError(`El SKU "${data.sku}" ya existe`);

    if (data.isDefault) {
      await prisma.productVariant.updateMany({ where: { productId }, data: { isDefault: false } });
    }

    return prisma.productVariant.create({ data: { ...data, productId } });
  },

  async updateVariant(productId: string, variantId: string, data: UpdateVariantInput) {
    const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId } });
    if (!variant) throw new NotFoundError('Variante no encontrada');

    if (data.sku && data.sku !== variant.sku) {
      const skuExists = await prisma.productVariant.findFirst({
        where: { sku: data.sku, NOT: { id: variantId } },
      });
      if (skuExists) throw new ConflictError(`El SKU "${data.sku}" ya existe`);
    }

    if (data.isDefault) {
      await prisma.productVariant.updateMany({ where: { productId }, data: { isDefault: false } });
    }

    return prisma.productVariant.update({ where: { id: variantId }, data });
  },

  async deleteVariant(productId: string, variantId: string) {
    const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId } });
    if (!variant) throw new NotFoundError('Variante no encontrada');
    await prisma.productVariant.delete({ where: { id: variantId } });
  },
};
