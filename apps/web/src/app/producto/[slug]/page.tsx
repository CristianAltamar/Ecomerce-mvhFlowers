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
    return {
      title: product.name,
      description: product.shortDescription ?? product.description ?? undefined,
      openGraph: {
        title: product.name,
        description: product.shortDescription ?? undefined,
        images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
      },
    };
  } catch {
    return { title: 'Producto no encontrado' };
  }
}

export default async function ProductPage({ params }: PageProps) {
  let product;
  try {
    product = await api.getProductBySlug(params.slug);
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) notFound();
    throw err;
  }

  const mainImage = product.images[0];
  const galleryImages = product.images.slice(1);
  const hasDiscount =
    product.compareAtPriceCents && product.compareAtPriceCents > product.priceCents;

  return (
    <div className="container-mvh py-12 lg:py-16">
      {/* Breadcrumb */}
      <nav className="text-xs uppercase tracking-widest text-burgundy-900/60 mb-8">
        <Link href="/" className="hover:text-gold-700">Inicio</Link>
        {product.category && (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/categoria/${product.category.slug}`}
              className="hover:text-gold-700"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-burgundy-900 truncate inline-block max-w-[200px] align-bottom">
          {product.name}
        </span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
        {/* === Galería === */}
        <div>
          {mainImage ? (
            <div className="relative aspect-[4/5] bg-cream-100 overflow-hidden shadow-premium">
              <Image
                src={mainImage.url}
                alt={mainImage.alt ?? product.name}
                fill
                priority
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
              {product.isFeatured && (
                <div className="absolute top-4 left-4 bg-burgundy-950/90 text-gold-400 text-[10px] uppercase tracking-widest px-3 py-1 backdrop-blur-sm">
                  Destacado
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-[4/5] bg-cream-100 flex items-center justify-center text-burgundy-900/30 font-display italic">
              sin imagen
            </div>
          )}

          {galleryImages.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mt-4">
              {galleryImages.map((img) => (
                <div key={img.id} className="aspect-square bg-cream-100 overflow-hidden">
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
          <h1 className="font-display text-4xl lg:text-5xl text-burgundy-900 leading-tight text-balance">
            {product.name}
          </h1>

          {product.shortDescription && (
            <p className="mt-4 text-lg text-burgundy-900/70 leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          {/* Precio */}
          <div className="mt-8 flex items-baseline gap-3">
            <span className="font-display text-4xl text-burgundy-900 font-semibold">
              {formatCOP(product.priceCents)}
            </span>
            {hasDiscount && (
              <span className="text-lg text-burgundy-900/40 line-through">
                {formatCOP(product.compareAtPriceCents!)}
              </span>
            )}
          </div>

          {/* Línea dorada */}
          <div className="my-8 h-px bg-gradient-to-r from-gold-500/40 via-gold-500 to-transparent" />

          {/* Add to cart (Client Component) */}
          <AddToCartButton product={product} />

          {/* Descripción */}
          {product.description && (
            <div className="mt-12">
              <h2 className="eyebrow mb-4">Descripción</h2>
              <p className="text-burgundy-900/80 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Info adicional */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-burgundy-900/10">
            <div className="flex items-start gap-3">
              <span className="text-gold-500 text-2xl mt-1">✦</span>
              <div>
                <p className="font-display text-burgundy-900">Entrega el mismo día</p>
                <p className="text-xs text-burgundy-900/60 mt-1">
                  Pide antes de las 5:00 PM en Barranquilla.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-gold-500 text-2xl mt-1">✦</span>
              <div>
                <p className="font-display text-burgundy-900">Flores frescas</p>
                <p className="text-xs text-burgundy-900/60 mt-1">
                  Seleccionadas cuidadosamente cada mañana.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-gold-500 text-2xl mt-1">✦</span>
              <div>
                <p className="font-display text-burgundy-900">Asesoría personalizada</p>
                <p className="text-xs text-burgundy-900/60 mt-1">
                  ¿Dudas? Escríbenos por WhatsApp.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-gold-500 text-2xl mt-1">✦</span>
              <div>
                <p className="font-display text-burgundy-900">Pago seguro</p>
                <p className="text-xs text-burgundy-900/60 mt-1">
                  Tarjeta, PSE, Nequi y contraentrega.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
