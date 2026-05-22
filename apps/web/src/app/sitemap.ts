import type { MetadataRoute } from 'next';
import { api } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mvhflores.co';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/contacto`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  let categoryRoutes: MetadataRoute.Sitemap = [];

  try {
    let page = 1;
    while (true) {
      const result = await api.getProducts({ page, perPage: 100 });
      productRoutes.push(
        ...result.data.map((p) => ({
          url: `${SITE_URL}/producto/${p.slug}`,
          lastModified: new Date(p.updatedAt),
          changeFrequency: 'weekly' as const,
          priority: p.isFeatured ? 0.9 : 0.7,
        })),
      );
      if (page >= result.meta.totalPages) break;
      page++;
    }
  } catch {}

  try {
    const categories = await api.getCategories();
    const flatten = (cats: typeof categories): typeof categories =>
      cats.flatMap((c) => [c, ...(c.children ? flatten(c.children) : [])]);
    categoryRoutes = flatten(categories).map((c) => ({
      url: `${SITE_URL}/categoria/${c.slug}`,
      lastModified: new Date(c.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {}

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
