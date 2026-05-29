import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../lib/errors';
import { buildPaginated, getSkipTake } from '../../lib/pagination';
import { cache } from '../../lib/cache';
import type { ListProductsQuery } from './product.schemas';
import { productImagesInclude, mapProduct } from './product.mapper';

const productInclude = {
  category: { select: { id: true, slug: true, name: true } },
  images: productImagesInclude,
  variants: { orderBy: { isDefault: 'desc' as const } },
} satisfies Prisma.ProductInclude;

export const productService = {
  async list(query: ListProductsQuery) {
    const cacheKey = `products:list:${Buffer.from(JSON.stringify(query)).toString('base64')}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const where: Prisma.ProductWhereInput = { isActive: true };

    if (query.featured !== undefined) where.isFeatured = query.featured;
    if (query.onSale === true) {
      where.compareAtPrice = { not: null };
      // Filtramos en JS porque Prisma no soporta comparar dos columnas directamente
      // El service devuelve todos con compareAt != null y los filtramos abajo
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { shortDescription: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.category) {
      const cat = await prisma.category.findUnique({
        where: { slug: query.category },
        include: { children: { select: { id: true } } },
      });
      if (cat) {
        const ids = [cat.id, ...cat.children.map((c) => c.id)];
        where.categoryId = { in: ids };
      } else {
        return buildPaginated([], 0, query);
      }
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = (() => {
      switch (query.sort) {
        case 'price_asc': return { price: 'asc' };
        case 'price_desc': return { price: 'desc' };
        case 'name_asc': return { name: 'asc' };
        case 'newest':
        default: return { createdAt: 'desc' };
      }
    })();

    let [items, total] = await Promise.all([
      prisma.product.findMany({ where, include: productInclude, orderBy, ...getSkipTake(query) }),
      prisma.product.count({ where }),
    ]);

    // Filtra en memoria productos realmente en oferta (compareAt > price)
    if (query.onSale === true) {
      items = items.filter(
        (p) => p.compareAtPrice !== null && p.compareAtPrice > p.price,
      );
      total = items.length;
    }

    const result = buildPaginated(items.map(mapProduct), total, query);
    await cache.set(cacheKey, result, 300);
    return result;
  },

  async getBySlug(slug: string) {
    const cacheKey = `products:slug:${slug}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const product = await prisma.product.findFirst({
      where: { slug, isActive: true },
      include: productInclude,
    });
    if (!product) throw new NotFoundError(`Producto "${slug}" no encontrado`);

    const mapped = mapProduct(product);
    await cache.set(cacheKey, mapped, 600);
    return mapped;
  },

  async getFeatured(limit = 8) {
    const cacheKey = `products:featured:${limit}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: productInclude,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const mapped = products.map(mapProduct);
    await cache.set(cacheKey, mapped, 600);
    return mapped;
  },
};
