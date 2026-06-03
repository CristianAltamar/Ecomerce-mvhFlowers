import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

/**
 * POST /api/revalidate
 * Invalida el cache de datos de Next.js (fetch cache / ISR) para todas las rutas.
 * Se llama desde el panel admin al crear/editar categorías o al pulsar "Limpiar caché".
 */
export async function POST() {
  revalidatePath('/', 'layout');
  return NextResponse.json({ revalidated: true });
}
