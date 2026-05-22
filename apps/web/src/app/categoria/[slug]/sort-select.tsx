'use client';

import { useRouter } from 'next/navigation';

interface SortSelectProps {
  slug: string;
  value: string;
}

export function SortSelect({ slug, value }: SortSelectProps) {
  const router = useRouter();

  return (
    <select
      id="sort"
      name="sort"
      defaultValue={value}
      className="bg-transparent border border-burgundy-900/20 px-3 py-2 text-sm text-burgundy-900 focus:outline-none focus:border-gold-500"
      onChange={(e) => {
        router.push(`/categoria/${slug}?sort=${e.target.value}`);
      }}
    >
      <option value="newest">Más recientes</option>
      <option value="price_asc">Precio: menor a mayor</option>
      <option value="price_desc">Precio: mayor a menor</option>
      <option value="name_asc">Nombre A–Z</option>
    </select>
  );
}
