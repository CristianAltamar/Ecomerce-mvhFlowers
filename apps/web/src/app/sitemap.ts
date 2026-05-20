import type { MetadataRoute } from 'next';
import { api } from '@/lib/api';

/**
 * Sitemap dinámico generado a partir de productos y categorías reales.
 * Next.js lo expone en /sitemap.xml automáticamente.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/contacto`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  try {
    const [productsPage, categories] = await Promise.all([
      api.getProducts({ perPage: 100 }),
      api.getCategories(),
    ]);

    const productRoutes: MetadataRoute.Sitemap = productsPage.data.map((p) => ({
      url: `${siteUrl}/producto/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    const flattenCategories = (cats: typeof categories): typeof categories =>
      cats.flatMap((c) => [c, ...(c.children ? flattenCategories(c.children) : [])]);

    const categoryRoutes: MetadataRoute.Sitemap = flattenCategories(categories).map((c) => ({
      url: `${siteUrl}/categoria/${c.slug}`,
      lastModified: new Date(c.updatedAt),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [...staticRoutes, ...productRoutes, ...categoryRoutes];
  } catch {
    // Si la API no responde, devolvemos al menos las rutas estáticas
    return staticRoutes;
  }
}
