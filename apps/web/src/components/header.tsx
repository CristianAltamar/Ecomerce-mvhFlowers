'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Logo } from './logo';
import { useCartStore, selectCartCount } from '@/store/cart-store';
import { useSearchStore } from '@/store/search-store';
import { cn } from '@/lib/cn';

// ── Tipos (exportados para el Server Component wrapper) ───────────────────

export type NavGrandchild = { label: string; href: string };

export type NavChild = {
  label: string;
  href: string;
  children?: NavGrandchild[];
};

export type NavItem = {
  label: string;
  href: string;
  children?: NavChild[];
};

// ── Iconos inline ──────────────────────────────────────────────────────────

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      width="10" height="10"
      viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5"
      className={className}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      width="10" height="10"
      viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5"
    >
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

// ── Componente principal ───────────────────────────────────────────────────

export function Header({ navItems }: { navItems: NavItem[] }) {
  const cartCount = useCartStore(selectCartCount);
  const openCart  = useCartStore((s) => s.openCart);

  const { isOpen: isSearchOpen, openSearch, closeSearch } = useSearchStore();

  const [mobileOpen, setMobileOpen]       = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  const toggleMobile = (href: string) =>
    setMobileExpanded((v) => (v === href ? null : href));

  return (
    <>
      {/* ── Header + Banner en un solo bloque sticky ─────────────────────
          Ambos son sticky juntos, así el panel de búsqueda (top:117px)
          siempre queda alineado debajo sin importar el scroll.           */}
      <header data-th-section="header" className="sticky top-0 z-40">

        {/* Banner superior */}
        <div className="bg-ink text-muted text-[11px] tracking-wider">
          <div className="container-mvh py-2 flex items-center justify-center gap-2 text-center">
            <span className="text-accent-light">✦</span>
            <span>
              Entrega el mismo día en Barranquilla
              <span className="opacity-60 mx-2">·</span>
              <span className="font-semibold">Pide antes de las 5:00 PM</span>
            </span>
            <span className="text-accent-light">✦</span>
          </div>
        </div>

        {/* Nav principal */}
        <div className="bg-surface/95 backdrop-blur-md border-b border-primary/10">
        <div className="container-mvh">
          <div className="flex items-center justify-between h-20">

            {/* Hamburger mobile */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2 text-primary"
              aria-label="Abrir menú"
            >
              {mobileOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>

            {/* Logo */}
            <div className="flex-1 lg:flex-none flex justify-center lg:justify-start">
              <Logo />
            </div>

            {/* ── Nav desktop ─────────────────────────────────────────── */}
            <nav className="hidden lg:flex items-center gap-6 mx-6 flex-1 justify-center">
              {navItems.map((item) => (
                <div key={item.href} className="group/nav relative">

                  {/* Item principal */}
                  <Link
                    href={item.href}
                    className="flex items-center gap-1 text-[11px] uppercase tracking-widest text-primary hover:text-accent transition-colors duration-200 py-8 whitespace-nowrap relative"
                  >
                    {item.label}
                    {item.children && (
                      <ChevronDown className="transition-transform duration-200 group-hover/nav:rotate-180" />
                    )}
                    {/* Underline animado */}
                    <span className="absolute bottom-5 left-0 right-0 h-px bg-accent scale-x-0 group-hover/nav:scale-x-100 transition-transform duration-300 origin-left" />
                  </Link>

                  {/* ── Dropdown nivel 1 ── */}
                  {item.children && (
                    <div className="absolute top-full left-0 z-50 invisible opacity-0 group-hover/nav:visible group-hover/nav:opacity-100 transition-all duration-150">
                      <div className="mt-0 bg-surface border border-primary/10 shadow-premium-lg min-w-[210px]">
                        {item.children.map((child) => (
                          <div key={child.href} className="group/sub relative">

                            <Link
                              href={child.href}
                              className="flex items-center justify-between px-5 py-3 text-[12px] text-primary hover:bg-muted hover:text-accent transition-colors whitespace-nowrap"
                            >
                              {child.label}
                              {child.children && <ChevronRight />}
                            </Link>

                            {/* ── Dropdown nivel 2 (flyout) ── */}
                            {child.children && (
                              <div className="absolute left-full top-0 invisible opacity-0 group-hover/sub:visible group-hover/sub:opacity-100 transition-all duration-150 ml-px">
                                <div className="bg-surface border border-primary/10 shadow-premium-lg min-w-[190px]">
                                  {child.children.map((grand) => (
                                    <Link
                                      key={grand.href}
                                      href={grand.href}
                                      className="block px-5 py-3 text-[12px] text-primary hover:bg-muted hover:text-accent transition-colors whitespace-nowrap"
                                    >
                                      {grand.label}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* ── Acciones ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-1 sm:gap-2">

              {/* Buscar */}
              <button
                onClick={isSearchOpen ? closeSearch : openSearch}
                className="p-2 text-primary hover:text-accent transition-colors"
                aria-label={isSearchOpen ? 'Cerrar búsqueda' : 'Buscar'}
              >
                {isSearchOpen ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                )}
              </button>

              {/* Cuenta */}
              <Link
                href="/cuenta"
                className="hidden sm:block p-2 text-primary hover:text-accent transition-colors"
                aria-label="Mi cuenta"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </Link>

              {/* Carrito */}
              <button
                onClick={openCart}
                className="relative p-2 text-primary hover:text-accent transition-colors"
                aria-label="Carrito"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-surface text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Nav mobile ────────────────────────────────────────────────── */}
        <div
          className={cn(
            'lg:hidden border-t border-primary/10 bg-surface overflow-hidden transition-all duration-300',
            mobileOpen ? 'max-h-[600px]' : 'max-h-0',
          )}
        >
          <nav className="container-mvh py-4 flex flex-col">
            {navItems.map((item) => (
              <div key={item.href}>
                {/* Fila del item */}
                <div className="flex items-center border-b border-primary/8">
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 py-3 px-2 text-xs uppercase tracking-widest text-primary"
                  >
                    {item.label}
                  </Link>
                  {item.children && (
                    <button
                      onClick={() => toggleMobile(item.href)}
                      className="px-3 py-3 text-primary"
                      aria-label="Expandir"
                    >
                      <ChevronDown
                        className={cn(
                          'transition-transform duration-200',
                          mobileExpanded === item.href && 'rotate-180',
                        )}
                      />
                    </button>
                  )}
                </div>

                {/* Sub-items expandidos */}
                {item.children && mobileExpanded === item.href && (
                  <div className="pl-4 pb-1 bg-muted/60">
                    {item.children.map((child) => (
                      <div key={child.href}>
                        <Link
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-between py-2.5 px-2 text-[11px] uppercase tracking-widest text-primary/70 hover:text-accent transition-colors border-b border-primary/6 last:border-0"
                        >
                          {child.label}
                          {child.children && <ChevronRight />}
                        </Link>
                        {child.children && (
                          <div className="pl-4">
                            {child.children.map((grand) => (
                              <Link
                                key={grand.href}
                                href={grand.href}
                                onClick={() => setMobileOpen(false)}
                                className="block py-2 px-2 text-[11px] text-primary/50 hover:text-accent transition-colors"
                              >
                                — {grand.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
        </div> {/* cierra bg-surface/95 nav wrapper */}
      </header>
    </>
  );
}
