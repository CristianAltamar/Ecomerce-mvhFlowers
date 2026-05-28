import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { formatCOP } from '@mvh/utils';
import { ApiClientError } from '@/lib/api-client';
import { AddToCartButton } from './add-to-cart-button';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const product = await api.getProductBySlug(params.slug);
    const description = product.shortDescription ?? product.description ?? undefined;
    return {
      title: product.name,
      description,
      alternates: { canonical: `/producto/${params.slug}` },
      openGraph: {
        title: product.name,
        description: description ?? undefined,
        images: product.images[0] ? [{ url: product.images[0].url, alt: product.name }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: description ?? undefined,
        images: product.images[0] ? [product.images[0].url] : undefined,
      },
    };
  } catch {
    return { title: 'Producto no encontrado' };
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mvhflores.co';

export default async function ProductPage({ params }: PageProps) {
  let product;
  try {
    product = await api.getProductBySlug(params.slug);
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) notFound();
    throw err;
  }

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription ?? product.description ?? undefined,
    image: product.images[0]?.url,
    brand: { '@type': 'Brand', name: 'MVH Flowers' },
    offers: {
      '@type': 'Offer',
      price: (product.priceCents / 100).toFixed(0),
      priceCurrency: 'COP',
      availability:
        product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${SITE_URL}/producto/${product.slug}`,
    },
  };

  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
    ...(product.category
      ? [{ '@type': 'ListItem', position: 2, name: product.category.name, item: `${SITE_URL}/categoria/${product.category.slug}` }]
      : []),
    { '@type': 'ListItem', position: product.category ? 3 : 2, name: product.name, item: `${SITE_URL}/producto/${product.slug}` },
  ];
  const breadcrumbJsonLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: breadcrumbItems };

  const mainImage = product.images[0];
  const galleryImages = product.images.slice(1);
  const hasDiscount =
    product.compareAtPriceCents && product.compareAtPriceCents > product.priceCents;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
    <div data-th-section="producto" className="container-mvh py-12 lg:py-16">
      {/* Breadcrumb */}
      <nav className="text-xs uppercase tracking-widest text-primary/60 mb-8">
        <Link href="/" className="hover:text-accent">Inicio</Link>
        {product.category && (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/categoria/${product.category.slug}`}
              className="hover:text-accent"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-primary truncate inline-block max-w-[200px] align-bottom">
          {product.name}
        </span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
        {/* === Galería === */}
        <div>
          {mainImage ? (
            <div className="relative aspect-[4/5] bg-muted overflow-hidden shadow-premium">
              <Image
                src={mainImage.url}
                alt={mainImage.alt ?? product.name}
                fill
                priority
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
              {product.isFeatured && (
                <div className="absolute top-4 left-4 bg-ink/90 text-accent-light text-[10px] uppercase tracking-widest px-3 py-1 backdrop-blur-sm">
                  Destacado
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-[4/5] bg-muted flex items-center justify-center text-primary/30 font-display italic">
              sin imagen
            </div>
          )}

          {galleryImages.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mt-4">
              {galleryImages.map((img) => (
                <div key={img.id} className="aspect-square bg-muted overflow-hidden">
                  <Image
                    src={img.url}
                    alt={img.alt ?? product.name}
                    width={200}
                    height={200}
                    className="object-cover w-full h-full"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* === Info === */}
        <div className="lg:pt-4">
          {product.category && (
            <p className="eyebrow mb-3">{product.category.name}</p>
          )}
          <h1 className="font-display text-4xl lg:text-5xl text-primary leading-tight text-balance">
            {product.name}
          </h1>

          {product.shortDescription && (
            <p className="mt-4 text-lg text-primary/70 leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          {/* Precio */}
          <div className="mt-8 flex items-baseline gap-3">
            <span className="font-display text-4xl text-primary font-semibold">
              {formatCOP(product.priceCents)}
            </span>
            {hasDiscount && (
              <span className="text-lg text-primary/40 line-through">
                {formatCOP(product.compareAtPriceCents!)}
              </span>
            )}
          </div>

          {/* Línea dorada */}
          <div className="my-8 h-px bg-gradient-to-r from-accent/40 via-accent to-transparent" />

          {/* Add to cart (Client Component) */}
          <AddToCartButton product={product} />

          {/* Descripción */}
          {product.description && (
            <div className="mt-12">
              <h2 className="eyebrow mb-4">Descripción</h2>
              <p className="text-primary/80 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Info adicional */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-primary/10">
            <div className="flex items-start gap-3">
              <span className="text-accent text-2xl mt-1">✦</span>
              <div>
                <p className="font-display text-primary">Entrega el mismo día</p>
                <p className="text-xs text-primary/60 mt-1">
                  Pide antes de las 5:00 PM en Barranquilla.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-accent text-2xl mt-1">✦</span>
              <div>
                <p className="font-display text-primary">Flores frescas</p>
                <p className="text-xs text-primary/60 mt-1">
                  Seleccionadas cuidadosamente cada mañana.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-accent text-2xl mt-1">✦</span>
              <div>
                <p className="font-display text-primary">Asesoría personalizada</p>
                <p className="text-xs text-primary/60 mt-1">
                  ¿Dudas? Escríbenos por WhatsApp.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-accent text-2xl mt-1">✦</span>
              <div>
                <p className="font-display text-primary">Pago seguro</p>
                <p className="text-xs text-primary/60 mt-1">
                  Tarjeta, PSE, Nequi y contraentrega.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
