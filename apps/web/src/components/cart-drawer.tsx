'use client';

import Link from 'next/link';
import { useCartStore, selectCartCount, selectCartSubtotal } from '@/store/cart-store';
import { formatCOP } from '@mvh/utils';
import { cn } from '@/lib/cn';
export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const count = useCartStore(selectCartCount);
  const subtotal = useCartStore(selectCartSubtotal);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className={cn(
          'fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-full max-w-md bg-surface shadow-premium-lg transition-transform duration-500 flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-label="Carrito de compras"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary/10">
          <h2 className="font-display text-2xl text-primary">
            Tu carrito <span className="text-accent text-base">({count})</span>
          </h2>
          <button
            onClick={closeCart}
            className="p-2 text-primary hover:text-accent"
            aria-label="Cerrar carrito"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-accent text-4xl mb-4">✦</div>
              <p className="font-display text-xl text-primary mb-2">Tu carrito está vacío</p>
              <p className="text-sm text-primary/60 mb-8">
                Descubre nuestros arreglos florales.
              </p>
              <button onClick={closeCart} className="btn-outline">
                Explorar catálogo
              </button>
            </div>
          ) : (
            <ul className="space-y-6">
              {items.map((item) => (
                <li
                  key={`${item.productId}-${item.variantId ?? '_'}`}
                  className="flex gap-4 pb-6 border-b border-primary/10 last:border-0"
                >
                  {item.imageUrl && (
                    <div className="w-20 h-24 bg-muted overflow-hidden flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/producto/${item.slug}`}
                      onClick={closeCart}
                      className="font-display text-primary hover:text-accent transition-colors line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    {item.variantName && (
                      <p className="text-xs text-primary/60 mt-0.5">{item.variantName}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-primary/20">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1, item.variantId)
                          }
                          className="px-2 py-1 text-primary hover:bg-primary/5"
                          aria-label="Disminuir"
                        >
                          −
                        </button>
                        <span className="px-3 text-sm">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1, item.variantId)
                          }
                          className="px-2 py-1 text-primary hover:bg-primary/5"
                          aria-label="Aumentar"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        {formatCOP(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="text-xs text-primary/50 hover:text-primary mt-2 underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-primary/10 p-6 space-y-4 bg-muted/50">
            <div className="flex justify-between items-baseline">
              <span className="eyebrow">Subtotal</span>
              <span className="font-display text-2xl text-primary">
                {formatCOP(subtotal)}
              </span>
            </div>
            <p className="text-xs text-primary/60 text-center">
              El costo de envío se calcula en el checkout según tu zona.
            </p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="btn-primary w-full text-center block"
            >
              Finalizar compra
            </Link>
            <button onClick={closeCart} className="btn-outline w-full">
              Seguir comprando
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
