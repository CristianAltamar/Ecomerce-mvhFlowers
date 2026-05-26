/**
 * CategorySidebar — Server Component
 *
 * Panel lateral de la página de categoría.
 * Muestra el árbol completo de categorías (activo = expandido)
 * y el filtro de precio (PriceFilter, client component).
 */
import Link from 'next/link';
import type { Category } from '@mvh/types';
import { PriceFilter } from './price-filter';

interface CategorySidebarProps {
  /** Árbol completo de categorías raíz (con children) */
  categories: Category[];
  /** Slug de la categoría que se está viendo */
  currentSlug: string;
  /** Slug del padre, si la categoría actual es un hijo */
  parentSlug?: string;
  /** Valor actual de ordenamiento */
  sort: string;
  /** Precio mínimo activo en pesos (0 = sin filtro) */
  initialMin: number;
  /** Precio máximo activo en pesos (0 = sin filtro) */
  initialMax: number;
}

export function CategorySidebar({
  categories,
  currentSlug,
  parentSlug,
  sort,
  initialMin,
  initialMax,
}: CategorySidebarProps) {
  return (
    <aside className="w-full lg:sticky lg:top-28 lg:self-start">
      {/* ── CATEGORÍAS ──────────────────────────────── */}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-burgundy-900/55 font-semibold mb-4">
          Categorías
        </p>

        <ul className="space-y-0">
          {categories.map((cat) => {
            const isCurrent = cat.slug === currentSlug;
            const isParent = cat.slug === parentSlug;
            const isExpanded = isCurrent || isParent;
            const hasChildren = (cat.children?.length ?? 0) > 0;

            return (
              <li key={cat.id}>
                {/* ── Categoría raíz ── */}
                <div className="flex items-center justify-between">
                  <Link
                    href={`/categoria/${cat.slug}`}
                    className={`text-sm py-2 flex-1 transition-colors duration-150 ${
                      isCurrent && !parentSlug
                        ? 'text-burgundy-900 font-semibold'
                        : 'text-burgundy-900/65 hover:text-burgundy-900'
                    }`}
                  >
                    {cat.name}
                  </Link>
                  {hasChildren && (
                    <span
                      aria-hidden="true"
                      className="text-[9px] text-burgundy-900/35 pl-2 select-none"
                    >
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  )}
                </div>

                {/* ── Subcategorías (expandidas si activo) ── */}
                {hasChildren && isExpanded && (
                  <ul className="mb-1 border-l border-burgundy-900/10 ml-0">
                    {cat.children!.map((child) => {
                      const isChildActive = child.slug === currentSlug;
                      return (
                        <li key={child.id}>
                          <Link
                            href={`/categoria/${child.slug}`}
                            className={`block text-sm py-1.5 pl-4 transition-colors duration-150 ${
                              isChildActive
                                ? 'text-burgundy-900 font-semibold border-l-2 border-burgundy-900 -ml-px'
                                : 'text-burgundy-900/55 hover:text-burgundy-900'
                            }`}
                          >
                            {child.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── Separador ── */}
      <div className="h-px bg-burgundy-900/10 mb-8" />

      {/* ── FILTRO DE PRECIO ── */}
      <PriceFilter
        slug={currentSlug}
        sort={sort}
        initialMin={initialMin}
        initialMax={initialMax}
      />
    </aside>
  );
}