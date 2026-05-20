'use client';

import { useState } from 'react';
import type { Product } from '@mvh/types';
import { useCartStore } from '@/store/cart-store';
import { formatCOP } from '@mvh/utils';
import { cn } from '@/lib/cn';

interface AddToCartButtonProps {
  product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants.find((v) => v.isDefault)?.id ?? product.variants[0]?.id ?? null,
  );

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);
  const effectivePrice = selectedVariant?.priceCents ?? product.priceCents;
  const stock = selectedVariant?.stock ?? product.stock;
  const isOutOfStock = stock <= 0;

  function handleAdd() {
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      slug: product.slug,
      name: product.name,
      variantName: selectedVariant?.name,
      imageUrl: product.images[0]?.url,
      unitPriceCents: effectivePrice,
      quantity,
    });
  }

  return (
    <div className="space-y-6">
      {/* Selector de variantes */}
      {product.variants.length > 0 && (
        <div>
          <p className="eyebrow mb-3">Tamaño</p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariantId(variant.id)}
                disabled={variant.stock <= 0}
                className={cn(
                  'px-4 py-3 border text-sm transition-all',
                  selectedVariantId === variant.id
                    ? 'border-burgundy-900 bg-burgundy-900 text-cream-50'
                    : 'border-burgundy-900/20 text-burgundy-900 hover:border-burgundy-900',
                  variant.stock <= 0 && 'opacity-40 cursor-not-allowed line-through',
                )}
              >
                <span className="block">{variant.name}</span>
                <span className="block text-xs opacity-80 mt-0.5">
                  {formatCOP(variant.priceCents)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cantidad + Add */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center border border-burgundy-900/20 h-14">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-4 text-lg text-burgundy-900 hover:bg-burgundy-900/5 h-full"
            aria-label="Disminuir cantidad"
          >
            −
          </button>
          <span className="px-4 font-medium min-w-[3rem] text-center">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
            disabled={quantity >= stock}
            className="px-4 text-lg text-burgundy-900 hover:bg-burgundy-900/5 h-full disabled:opacity-30"
            aria-label="Aumentar cantidad"
          >
            +
          </button>
        </div>

        <button
          onClick={handleAdd}
          disabled={isOutOfStock}
          className={cn('btn-primary flex-1 h-14', isOutOfStock && 'opacity-40 cursor-not-allowed')}
        >
          {isOutOfStock ? 'Agotado' : 'Agregar al carrito'}
          {!isOutOfStock && <span className="ml-2">→</span>}
        </button>
      </div>

      {!isOutOfStock && stock <= 5 && (
        <p className="text-sm text-gold-700 font-serif italic">
          ✦ Solo quedan {stock} disponibles
        </p>
      )}
    </div>
  );
}
