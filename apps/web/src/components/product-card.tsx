import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@mvh/types';
import { formatCOP } from '@mvh/utils';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const image = product.images[0];
  const hasDiscount =
    product.compareAtPriceCents && product.compareAtPriceCents > product.priceCents;

  return (
    <Link href={`/producto/${product.slug}`} className="product-card">
      {/* Imagen */}
      <div className="aspect-[4/5] overflow-hidden bg-cream-100 relative">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt ?? product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            priority={priority}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-burgundy-900/30 font-display italic">
            sin imagen
          </div>
        )}

        {/* Badge premium */}
        {product.isFeatured && (
          <div className="absolute top-3 left-3 bg-burgundy-950/90 text-gold-400 text-[10px] uppercase tracking-widest px-3 py-1 backdrop-blur-sm">
            Destacado
          </div>
        )}

        {/* Quick view overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-burgundy-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-4 flex items-end justify-center">
          <span className="text-cream-50 text-xs uppercase tracking-widest border-b border-gold-400 pb-1">
            Ver detalles →
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-5 text-center">
        {product.category && (
          <p className="eyebrow mb-2">{product.category.name}</p>
        )}
        <h3 className="font-display text-lg text-burgundy-900 leading-tight mb-3 group-hover:text-gold-700 transition-colors line-clamp-2 min-h-[3.5rem]">
          {product.name}
        </h3>
        <div className="flex items-center justify-center gap-2 text-sm">
          {hasDiscount && (
            <span className="text-burgundy-900/40 line-through">
              {formatCOP(product.compareAtPriceCents!)}
            </span>
          )}
          <span className="text-burgundy-900 font-semibold">
            {formatCOP(product.priceCents)}
          </span>
        </div>
      </div>
    </Link>
  );
}
