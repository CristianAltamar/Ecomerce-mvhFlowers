/**
 * HeaderServer — Server Component
 *
 * Fetcha el árbol de categorías desde la API (GET /categories),
 * construye los NavItems dinámicamente y se los pasa al Header client component.
 *
 * Fallback: si la API falla (dev sin backend, etc.), se renderizan
 * sólo los ítems estáticos (Inicio + Contacto).
 */
import { apiFetch } from '@/lib/api-client';
import type { Category } from '@mvh/types';
import { Header } from './header';
import type { NavItem } from './header';

// ── Items estáticos que siempre van en el nav ──────────────────────────────

const NAV_START: NavItem[] = [{ label: 'Inicio', href: '/' }];

const NAV_END: NavItem[] = [{ label: 'Contacto', href: '/contacto' }];

// ── Mapper: Category[] (árbol API) → NavItem[] ────────────────────────────

function mapCategories(categories: Category[]): NavItem[] {
  const dynamic: NavItem[] = categories.map((cat) => ({
    label: cat.name,
    href: `/categoria/${cat.slug}`,
    children: cat.children?.length
      ? cat.children.map((child) => ({
          label: child.name,
          href: `/categoria/${child.slug}`,
          children: child.children?.length
            ? child.children.map((grand) => ({
                label: grand.name,
                href: `/categoria/${grand.slug}`,
              }))
            : undefined,
        }))
      : undefined,
  }));

  return [...NAV_START, ...dynamic, ...NAV_END];
}

// ── Server Component ───────────────────────────────────────────────────────

export async function HeaderServer() {
  let categories: Category[] = [];

  try {
    console.time('Fetch categorías');
    categories = await apiFetch<Category[]>('/categories', {
      // Revalidar cada hora; on-demand con revalidateTag('categories')
      revalidate: 3600,
    });
  } catch {
    // API no disponible (ej. dev sin backend): nav con sólo ítems estáticos
    console.warn('No se pudieron cargar las categorías para el header');
  }

  return <Header navItems={mapCategories(categories)} />;
}
