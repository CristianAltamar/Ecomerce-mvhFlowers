/**
 * Utilidades puras compartidas entre apps.
 * No deben importar dependencias específicas de runtime (Node/Browser).
 */

/**
 * Formatea un monto en pesos colombianos (enteros, sin decimales).
 * El sistema almacena y opera siempre en pesos (no centavos).
 * @example formatCOP(150000) → "$ 150.000"
 */
export function formatCOP(pesos: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(pesos));
}

/**
 * Convierte un texto a slug URL-safe.
 * @example slugify("Sembrado Floral Primavera") → "sembrado-floral-primavera"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/[^a-z0-9\s-]/g, '') // quita caracteres especiales
    .trim()
    .replace(/\s+/g, '-') // espacios → guiones
    .replace(/-+/g, '-'); // colapsa guiones múltiples
}

/**
 * Trunca un texto a una longitud máxima, agregando "…" si fue cortado.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + '…';
}

/**
 * Espera N milisegundos. Útil en retries.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Type guard para distinguir Error de unknown en catches.
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Obtiene el mensaje de error de cualquier valor.
 */
export function errorMessage(value: unknown): string {
  if (isError(value)) return value.message;
  if (typeof value === 'string') return value;
  return 'Error desconocido';
}
