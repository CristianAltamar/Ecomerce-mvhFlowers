'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchStore } from '@/store/search-store';
import { apiFetch } from '@/lib/api-client';
import type { Paginated, Product } from '@mvh/types';
import { formatCOP } from '@mvh/utils';

// Altura total del banner (≈36px) + header (80px) + borde (1px)
const HEADER_HEIGHT = 117;

export function SearchModal() {
  const { isOpen, query, closeSearch, setQuery } = useSearchStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  /* ── Focus & body scroll ── */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  /* ── Escape key ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeSearch]);

  /* ── Debounce ── */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 320);
    return () => clearTimeout(t);
  }, [query]);

  /* ── Fetch ── */
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiFetch<Paginated<Product>>('/products', {
      searchParams: { search: debouncedQuery, perPage: 12 },
    })
      .then((res) => {
        if (!cancelled) setResults(res.data);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  if (!isOpen) return null;

  const hasQuery = debouncedQuery.length >= 2;

  return (
    <>
      {/* ── Backdrop (behind header) ── */}
      <div
        className="fixed inset-0 z-[35] bg-ink/25 backdrop-blur-[2px]"
        onClick={closeSearch}
        aria-hidden="true"
      />

      {/* ── Panel ── */}
      <div
        className="fixed left-0 right-0 bottom-0 z-[36] bg-surface overflow-y-auto animate-fade-in-up"
        style={{ top: `${HEADER_HEIGHT}px` }}
        role="dialog"
        aria-modal="true"
        aria-label="Búsqueda de productos"
      >
        <div className="container-mvh py-8 pb-16">

          {/* Search input */}
          <div className="flex items-center gap-4 border-b border-primary/15 pb-5 mb-10">
            <svg
              width="22" height="22"
              className="text-primary/40 flex-shrink-0"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="¿Qué estás buscando?"
              className="flex-1 bg-transparent font-display text-2xl text-primary placeholder:text-primary/25 outline-none"
            />

            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1.5 text-primary/40 hover:text-primary transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* ── States ── */}

          {!hasQuery && (
            <p className="text-center font-display italic text-primary/25 text-xl py-20">
              Escribe para buscar flores y arreglos…
            </p>
          )}

          {hasQuery && loading && (
            <p className="text-center font-display italic text-primary/40 text-xl py-20">
              Buscando…
            </p>
          )}

          {hasQuery && !loading && results.length === 0 && (
            <div className="text-center py-20">
              <p className="font-display text-2xl text-primary mb-2">Sin resultados</p>
              <p className="text-sm text-primary/50">
                Intenta con otro término de búsqueda.
              </p>
            </div>
          )}

          {hasQuery && !loading && results.length > 0 && (
            <>
              <p className="eyebrow mb-8">
                {results.length} resultado{results.length !== 1 ? 's' : ''} para &ldquo;{debouncedQuery}&rdquo;
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {results.map((product) => {
                  const image = product.images[0];
                  return (
                    <Link
                      key={product.id}
                      href={`/producto/${product.slug}`}
                      onClick={closeSearch}
                      className="product-card group"
                    >
                      <div className="aspect-[4/5] overflow-hidden bg-muted relative">
                        {image ? (
                          <Image
                            src={image.url}
                            alt={image.alt ?? product.name}
                            fill
                            sizes="(min-width: 1024px) 25vw, 50vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-primary/30 font-display italic text-sm">
                            sin imagen
                          </div>
                        )}
                      </div>
                      <div className="p-4 text-center">
                        <h3 className="font-display text-base text-primary leading-tight mb-2 group-hover:text-accent transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-sm text-primary/70 font-semibold">
                          {formatCOP(product.price)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
