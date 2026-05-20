import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../lib/errors';
import { buildPaginated, getSkipTake } from '../../lib/pagination';
import type { ListProductsQuery } from './product.schemas';

const productInclude = {
  category: { select: { id: true, slug: true, name: true } },
  images: { orderBy: { position: 'asc' as const } },
  variants: { orderBy: { isDefault: 'desc' as const } },
} satisfies Prisma.ProductInclude;

export const productService = {
  async list(query: ListProductsQuery) {
    const where: Prisma.ProductWhereInput = { isActive: true };

    if (query.featured !== undefined) where.isFeatured = query.featured;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { shortDescription: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.category) {
      // Permitir categoría directa o sus hijas (ej: filtrar "estilo" trae también bouquets, sembrados...)
      const cat = await prisma.category.findUnique({
        where: { slug: query.category },
        include: { children: { select: { id: true } } },
      });
      if (cat) {
        const ids = [cat.id, ...cat.children.map((c) => c.id)];
        where.categoryId = { in: ids };
      } else {
        // categoría inexistente → resultado vacío
        return buildPaginated([], 0, query);
      }
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.priceCents = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = (() => {
      switch (query.sort) {
        case 'price_asc':
          return { priceCents: 'asc' };
        case 'price_desc':
          return { priceCents: 'desc' };
        case 'name_asc':
          return { name: 'asc' };
        case 'newest':
        default:
          return { createdAt: 'desc' };
      }
    })();

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy,
        ...getSkipTake(query),
      }),
      prisma.product.count({ where }),
    ]);

    return buildPaginated(items, total, query);
  },

  async getBySlug(slug: string) {
    const product = await prisma.product.findFirst({
      where: { slug, isActive: true },
      include: productInclude,
    });
    if (!product) throw new NotFoundError(`Producto "${slug}" no encontrado`);
    return product;
  },

  async getFeatured(limit = 8) {
    return prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: productInclude,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
};
