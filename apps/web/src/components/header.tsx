'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Logo } from './logo';
import { useCartStore, selectCartCount } from '@/store/cart-store';
import { cn } from '@/lib/cn';

const NAV_ITEMS = [
  { label: 'Inicio', href: '/' },
  { label: 'Arreglos premium', href: '/categoria/arreglos-premium' },
  { label: 'Estilo', href: '/categoria/estilo' },
  { label: 'Ocasión', href: '/categoria/ocasion' },
  { label: 'Contacto', href: '/contacto' },
];

export function Header() {
  const cartCount = useCartStore(selectCartCount);
  const openCart = useCartStore((s) => s.openCart);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Banner superior */}
      <div className="bg-burgundy-950 text-cream-100 text-[11px] tracking-wider">
        <div className="container-mvh py-2 flex items-center justify-center gap-2 text-center">
          <span className="text-gold-400">✦</span>
          <span>
            Entrega el mismo día en Barranquilla
            <span className="opacity-60 mx-2">·</span>
            <span className="font-semibold">Pide antes de las 5:00 PM</span>
          </span>
          <span className="text-gold-400">✦</span>
        </div>
      </div>

      {/* Header principal */}
      <header className="sticky top-0 z-40 bg-cream-50/95 backdrop-blur-md border-b border-burgundy-900/10">
        <div className="container-mvh">
          <div className="flex items-center justify-between h-20">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2 text-burgundy-900"
              aria-label="Abrir menú"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Logo */}
            <div className="flex-1 lg:flex-none flex justify-center lg:justify-start">
              <Logo />
            </div>

            {/* Nav desktop */}
            <nav className="hidden lg:flex items-center gap-8 mx-8 flex-1 justify-center">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm uppercase tracking-widest text-burgundy-900 hover:text-gold-700 transition-colors duration-300 relative group"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 right-0 h-px bg-gold-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </Link>
              ))}
            </nav>

            {/* Acciones */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/buscar"
                className="p-2 text-burgundy-900 hover:text-gold-700 transition-colors"
                aria-label="Buscar"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </Link>
              <Link
                href="/cuenta"
                className="hidden sm:block p-2 text-burgundy-900 hover:text-gold-700 transition-colors"
                aria-label="Mi cuenta"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </Link>
              <button
                onClick={openCart}
                className="relative p-2 text-burgundy-900 hover:text-gold-700 transition-colors"
                aria-label="Carrito"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-burgundy-900 text-cream-50 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <div
          className={cn(
            'lg:hidden border-t border-burgundy-900/10 bg-cream-50 overflow-hidden transition-all duration-300',
            mobileOpen ? 'max-h-96' : 'max-h-0',
          )}
        >
          <nav className="container-mvh py-4 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="py-3 px-2 text-sm uppercase tracking-widest text-burgundy-900 border-b border-burgundy-900/10 last:border-0"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
    </>
  );
}
