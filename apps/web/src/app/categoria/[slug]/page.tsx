import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/product-card';
import { ApiClientError } from '@/lib/api-client';
import { SortSelect } from './sort-select';
import { CategorySidebar } from './category-sidebar';

interface PageProps {
  params: { slug: string };
  searchParams: {
    page?: string;
    sort?: string;
    minPrice?: string; // en centavos (como lo espera la API)
    maxPrice?: string; // en centavos
  };
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mvhflores.co';

// ── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const cat = await api.getCategoryBySlug(params.slug);
    const description =
      cat.description ??
      `Arreglos florales de ${cat.name} con entrega el mismo día en Barranquilla.`;
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

// ── Page ───────────────────────────────────────────────────────────────────

export default async function CategoryPage({ params, searchParams }: PageProps) {
  // ── Datos de la categoría ────────────────────────────────────────────────
  let category;
  try {
    category = await api.getCategoryBySlug(params.slug);
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) notFound();
    throw err;
  }

  // ── Search params ────────────────────────────────────────────────────────
  const page = Math.max(1, Number(searchParams.page) || 1);
  const sort =
    (searchParams.sort as 'newest' | 'price_asc' | 'price_desc' | 'name_asc') ?? 'newest';
  const minPriceCents = searchParams.minPrice ? Number(searchParams.minPrice) : undefined;
  const maxPriceCents = searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined;

  // ── Fetch paralelo: todas las categorías + productos filtrados ────────────
  const [allCategories, products] = await Promise.all([
    api.getCategories().catch(() => []),
    api
      .getProducts({
        category: params.slug,
        page,
        perPage: 12,
        sort,
        minPrice: minPriceCents,
        maxPrice: maxPriceCents,
      })
      .catch(() => ({ data: [], meta: { page: 1, perPage: 12, total: 0, totalPages: 1 } })),
  ]);

  // ── JSON-LD BreadcrumbList ────────────────────────────────────────────────
  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
    ...(category.parent
      ? [
          {
            '@type': 'ListItem',
            position: 2,
            name: category.parent.name,
            item: `${SITE_URL}/categoria/${category.parent.slug}`,
          },
        ]
      : []),
    {
      '@type': 'ListItem',
      position: category.parent ? 3 : 2,
      name: category.name,
      item: `${SITE_URL}/categoria/${category.slug}`,
    },
  ];
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  // ── Valores del slider en pesos (para pasar al sidebar) ──────────────────
  const sliderInitMin = minPriceCents ? Math.round(minPriceCents / 100) : 0;
  const sliderInitMax = maxPriceCents ? Math.round(maxPriceCents / 100) : 0;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div data-th-section="tienda" className="container-mvh py-12 lg:py-16">
        {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
        <nav className="text-xs uppercase tracking-widest text-primary/55 mb-6">
          <Link href="/" className="hover:text-accent transition-colors">
            Inicio
          </Link>
          {category.parent && (
            <>
              <span className="mx-2">/</span>
              <Link
                href={`/categoria/${category.parent.slug}`}
                className="hover:text-accent transition-colors"
              >
                {category.parent.name}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-primary">{category.name}</span>
        </nav>

        {/* ── Título de categoría (ancho completo) ──────────────────────── */}
        <header className="mb-10 text-center max-w-2xl mx-auto">
          <h1 className="font-display text-5xl lg:text-6xl text-primary">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-4 text-primary/70 text-lg leading-relaxed">
              {category.description}
            </p>
          )}
          <div className="gold-divider mt-8 max-w-xs mx-auto">
            <span className="text-accent">✦</span>
          </div>
        </header>

        {/* ── Layout de 2 columnas: sidebar + contenido ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10 items-start">

          {/* Sidebar */}
          <CategorySidebar
            categories={allCategories}
            currentSlug={params.slug}
            parentSlug={category.parent?.slug}
            sort={sort}
            initialMin={sliderInitMin}
            initialMax={sliderInitMax}
          />

          {/* Contenido principal */}
          <div>
            {/* Toolbar: total + sort */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-4 border-b border-primary/10">
              <p className="text-sm text-primary/65">
                {products.meta.total}{' '}
                {products.meta.total === 1 ? 'producto' : 'productos'}
                {(minPriceCents || maxPriceCents) && (
                  <span className="ml-2 text-xs text-accent">· Filtrado por precio</span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="sort"
                  className="text-xs uppercase tracking-widest text-primary/55"
                >
                  Ordenar
                </label>
                <SortSelect slug={params.slug} value={sort} />
              </div>
            </div>

            {/* Grid de productos */}
            {products.data.length === 0 ? (
              <div className="text-center py-24">
                <div className="text-accent text-4xl mb-4">✦</div>
                <p className="font-display text-2xl text-primary mb-3">
                  No hay productos en esta categoría
                  {(minPriceCents || maxPriceCents) && ' con ese rango de precio'}
                </p>
                <Link href={`/categoria/${params.slug}`} className="btn-outline mt-6 inline-flex">
                  Ver todos los productos
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {products.data.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

            {/* Paginación */}
            {products.meta.totalPages > 1 && (
              <nav
                aria-label="Paginación"
                className="flex justify-center items-center gap-2 mt-12"
              >
                {Array.from({ length: products.meta.totalPages }, (_, i) => i + 1).map((p) => {
                  const qp = new URLSearchParams();
                  qp.set('page', String(p));
                  if (sort !== 'newest') qp.set('sort', sort);
                  if (minPriceCents) qp.set('minPrice', String(minPriceCents));
                  if (maxPriceCents) qp.set('maxPrice', String(maxPriceCents));
                  return (
                    <Link
                      key={p}
                      href={`/categoria/${params.slug}?${qp.toString()}`}
                      className={`w-10 h-10 flex items-center justify-center text-sm border transition-colors ${
                        p === products.meta.page
                          ? 'border-primary bg-primary text-surface'
                          : 'border-primary/20 text-primary hover:border-accent'
                      }`}
                    >
                      {p}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
        </div>
      </div>
    </>
  );
}