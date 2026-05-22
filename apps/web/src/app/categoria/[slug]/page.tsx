import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/product-card';
import { ApiClientError } from '@/lib/api-client';
import { SortSelect } from './sort-select';

interface PageProps {
  params: { slug: string };
  searchParams: { page?: string; sort?: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const cat = await api.getCategoryBySlug(params.slug);
    const description = cat.description ?? `Arreglos florales de ${cat.name} con entrega el mismo día en Barranquilla.`;
    return {
      title: cat.name,
      description,
      alternates: { canonical: `/categoria/${params.slug}` },
      openGraph: {
        title: `${cat.name} | MVH Flowers`,
        description,
        images: cat.imageUrl ? [{ url: cat.imageUrl, alt: cat.name }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${cat.name} | MVH Flowers`,
        description,
        images: cat.imageUrl ? [cat.imageUrl] : undefined,
      },
    };
  } catch {
    return { title: 'Categoría no encontrada' };
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mvhflores.co';

export default async function CategoryPage({ params, searchParams }: PageProps) {
  let category;
  try {
    category = await api.getCategoryBySlug(params.slug);
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) notFound();
    throw err;
  }

  const page = Math.max(1, Number(searchParams.page) || 1);
  const sort = (searchParams.sort as 'newest' | 'price_asc' | 'price_desc' | 'name_asc') ?? 'newest';

  const products = await api
    .getProducts({ category: params.slug, page, perPage: 12, sort })
    .catch(() => ({ data: [], meta: { page: 1, perPage: 12, total: 0, totalPages: 1 } }));

  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
    ...(category.parent
      ? [{ '@type': 'ListItem', position: 2, name: category.parent.name, item: `${SITE_URL}/categoria/${category.parent.slug}` }]
      : []),
    { '@type': 'ListItem', position: category.parent ? 3 : 2, name: category.name, item: `${SITE_URL}/categoria/${category.slug}` },
  ];
  const breadcrumbJsonLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: breadcrumbItems };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
    <div className="container-mvh py-12 lg:py-16">
      {/* Breadcrumb */}
      <nav className="text-xs uppercase tracking-widest text-burgundy-900/60 mb-6">
        <Link href="/" className="hover:text-gold-700">Inicio</Link>
        {category.parent && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/categoria/${category.parent.slug}`} className="hover:text-gold-700">
              {category.parent.name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-burgundy-900">{category.name}</span>
      </nav>

      {/* Header */}
      <header className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="font-display text-5xl lg:text-6xl text-burgundy-900">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-4 text-burgundy-900/70 text-lg leading-relaxed">{category.description}</p>
        )}
        <div className="gold-divider mt-8 max-w-xs mx-auto">
          <span className="text-gold-500">✦</span>
        </div>
      </header>

      {/* Subcategorías si existen */}
      {category.children && category.children.length > 0 && (
        <div className="mb-12 flex flex-wrap justify-center gap-2">
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/categoria/${child.slug}`}
              className="px-4 py-2 border border-burgundy-900/20 text-sm text-burgundy-900 hover:border-gold-500 hover:text-gold-700 transition-colors"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      {/* Toolbar: total + sort */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-4 border-b border-burgundy-900/10">
        <p className="text-sm text-burgundy-900/70">
          {products.meta.total} {products.meta.total === 1 ? 'producto' : 'productos'}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-xs uppercase tracking-widest text-burgundy-900/60">
            Ordenar
          </label>
          <SortSelect slug={params.slug} value={sort} />
        </div>
      </div>

      {/* Grid */}
      {products.data.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-gold-500 text-4xl mb-4">✦</div>
          <p className="font-display text-2xl text-burgundy-900 mb-3">
            No hay productos en esta categoría aún
          </p>
          <Link href="/" className="btn-outline mt-6 inline-flex">
            Volver al inicio
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.data.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {/* Paginación */}
      {products.meta.totalPages > 1 && (
        <nav className="flex justify-center items-center gap-2 mt-12">
          {Array.from({ length: products.meta.totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/categoria/${params.slug}?page=${p}${sort ? `&sort=${sort}` : ''}`}
              className={`w-10 h-10 flex items-center justify-center text-sm border ${
                p === products.meta.page
                  ? 'border-burgundy-900 bg-burgundy-900 text-cream-50'
                  : 'border-burgundy-900/20 text-burgundy-900 hover:border-gold-500'
              }`}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </div>
    </>
  );
}
