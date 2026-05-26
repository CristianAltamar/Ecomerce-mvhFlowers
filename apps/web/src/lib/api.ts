import type { Category, Paginated, Product } from '@mvh/types';
import { apiFetch } from './api-client';

/**
 * Capa de acceso al API. Las usan los Server Components.
 * Para uso desde Client Components, envuélvelas en hooks de TanStack Query.
 */

export const api = {
  // === CATEGORÍAS ===
  async getCategories(): Promise<Category[]> {
    return apiFetch<Category[]>('/categories', {
      tags: ['categories'],
      revalidate: 600, // 10 min
    });
  },

  async getCategoryBySlug(slug: string): Promise<Category> {
    return apiFetch<Category>(`/categories/${encodeURIComponent(slug)}`, {
      tags: [`category:${slug}`],
      revalidate: 600,
    });
  },

  // === PRODUCTOS ===
  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    return apiFetch<Product[]>('/products/featured', {
      searchParams: { limit },
      tags: ['products:featured'],
      revalidate: 300,
    });
  },

  async getOnSaleProducts(limit = 8): Promise<Product[]> {
    const result = await apiFetch<{ data: Product[]; meta: unknown }>('/products', {
      searchParams: { onSale: 'true', perPage: limit, sort: 'newest' },
      tags: ['products:on-sale'],
      revalidate: 300,
    });
    return result.data;
  },

  async getProducts(params: {
    category?: string;
    featured?: boolean;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc';
    page?: number;
    perPage?: number;
  } = {}): Promise<Paginated<Product>> {
    return apiFetch<Paginated<Product>>('/products', {
      searchParams: params,
      tags: ['products'],
      revalidate: 300,
    });
  },

  async getProductBySlug(slug: string): Promise<Product> {
    return apiFetch<Product>(`/products/${encodeURIComponent(slug)}`, {
      tags: [`product:${slug}`],
      revalidate: 300,
    });
  },
};
