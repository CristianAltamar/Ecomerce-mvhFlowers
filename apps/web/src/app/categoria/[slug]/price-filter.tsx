'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** Límites del slider en pesos colombianos */
const SLIDER_MIN = 0;
const SLIDER_MAX = 1_500_000;
const STEP = 10_000;

interface PriceFilterProps {
  slug: string;
  sort: string;
  /** Precio mínimo inicial en pesos (0 = sin restricción) */
  initialMin: number;
  /** Precio máximo inicial en pesos (0 = sin restricción) */
  initialMax: number;
}

function formatPesos(value: number): string {
  return new Intl.NumberFormat('es-CO').format(value);
}

export function PriceFilter({ slug, sort, initialMin, initialMax }: PriceFilterProps) {
  const router = useRouter();
  const [minVal, setMinVal] = useState(initialMin > 0 ? initialMin : SLIDER_MIN);
  const [maxVal, setMaxVal] = useState(initialMax > 0 ? initialMax : SLIDER_MAX);

  const leftPct = (minVal / SLIDER_MAX) * 100;
  const rightPct = 100 - (maxVal / SLIDER_MAX) * 100;

  function handleFilter() {
    const params = new URLSearchParams();
    if (sort && sort !== 'newest') params.set('sort', sort);
    if (minVal > SLIDER_MIN) params.set('minPrice', String(minVal * 100)); // → centavos
    if (maxVal < SLIDER_MAX) params.set('maxPrice', String(maxVal * 100));
    const qs = params.toString();
    router.push(`/categoria/${slug}${qs ? `?${qs}` : ''}`);
  }

  function handleReset() {
    setMinVal(SLIDER_MIN);
    setMaxVal(SLIDER_MAX);
    const params = new URLSearchParams();
    if (sort && sort !== 'newest') params.set('sort', sort);
    router.push(`/categoria/${slug}${params.toString() ? `?${params.toString()}` : ''}`);
  }

  const isFiltered = minVal > SLIDER_MIN || maxVal < SLIDER_MAX;

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-burgundy-900/60 font-medium mb-6">
        Precio
      </p>

      {/* ── Dual range slider ── */}
      <div className="relative h-[2px] bg-burgundy-900/15 rounded-full mx-1 my-7">
        {/* Relleno entre los dos thumbs */}
        <div
          className="absolute h-[2px] bg-burgundy-900 rounded-full"
          style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
        />

        {/* Input min */}
        <input
          type="range"
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          step={STEP}
          value={minVal}
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), maxVal - STEP);
            setMinVal(v);
          }}
          aria-label="Precio mínimo"
          className="range-thumb absolute w-full -top-[8px]"
        />

        {/* Input max */}
        <input
          type="range"
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          step={STEP}
          value={maxVal}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), minVal + STEP);
            setMaxVal(v);
          }}
          aria-label="Precio máximo"
          className="range-thumb absolute w-full -top-[8px]"
        />
      </div>

      {/* Etiqueta de rango */}
      <p className="text-sm text-burgundy-900/70 mb-5">
        Precio:{' '}
        <span className="text-burgundy-900 font-medium">$ {formatPesos(minVal)}</span>
        {' — '}
        <span className="text-burgundy-900 font-medium">$ {formatPesos(maxVal)}</span>
      </p>

      {/* Botones */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleFilter}
          className="flex-1 border border-burgundy-900 text-burgundy-900 text-xs uppercase tracking-widest py-2.5 hover:bg-burgundy-900 hover:text-cream-50 transition-colors duration-200"
        >
          Filtrar
        </button>
        {isFiltered && (
          <button
            onClick={handleReset}
            title="Limpiar filtro"
            className="border border-burgundy-900/20 text-burgundy-900/50 text-xs py-2.5 px-3 hover:border-burgundy-900/50 hover:text-burgundy-900/70 transition-colors"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}