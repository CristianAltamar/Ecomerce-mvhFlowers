import { prisma } from '../../config/prisma';
import { NotFoundError, ConflictError } from '../../lib/errors';
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
  images: { orderBy: { position: 'asc' as const } },
  variants: { orderBy: { createdAt: 'asc' as const } },
  _count: { select: { orderItems: true } },
} as const;

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

    return { data, meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) } };
  },

  async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE,
    });
    if (!product) throw new NotFoundError('Producto no encontrado');
    return product;
  },

  async create(data: CreateProductInput) {
    const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
    if (existing) throw new ConflictError(`El slug "${data.slug}" ya existe`);

    return prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        shortDescription: data.shortDescription,
        priceCents: data.priceCents,
        compareAtPriceCents: data.compareAtPriceCents,
        categoryId: data.categoryId,
        stock: data.stock,
        isFeatured: data.isFeatured,
        isActive: data.isActive,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
      },
      include: PRODUCT_INCLUDE,
    });
  },

  async update(id: string, data: UpdateProductInput) {
    await this.getById(id);

    if (data.slug) {
      const conflict = await prisma.product.findFirst({
        where: { slug: data.slug, NOT: { id } },
      });
      if (conflict) throw new ConflictError(`El slug "${data.slug}" ya está en uso`);
    }

    return prisma.product.update({
      where: { id },
      data,
      include: PRODUCT_INCLUDE,
    });
  },

  async toggleActive(id: string) {
    const product = await this.getById(id);
    return prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
      include: PRODUCT_INCLUDE,
    });
  },

  // ─── Images ────────────────────────────────────────────────────────────────

  async addImage(productId: string, data: ProductImageInput) {
    await this.getById(productId);
    return prisma.productImage.create({ data: { ...data, productId } });
  },

  async deleteImage(productId: string, imageId: string) {
    const image = await prisma.productImage.findFirst({ where: { id: imageId, productId } });
    if (!image) throw new NotFoundError('Imagen no encontrada');
    await prisma.productImage.delete({ where: { id: imageId } });
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
