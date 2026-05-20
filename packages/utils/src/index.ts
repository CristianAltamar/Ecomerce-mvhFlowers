/**
 * Utilidades puras compartidas entre apps.
 * No deben importar dependencias específicas de runtime (Node/Browser).
 */

/**
 * Convierte centavos a un string formateado en pesos colombianos.
 * @example formatCOP(15000000) → "$ 150.000"
 */
export function formatCOP(cents: number): string {
  const pesos = Math.round(cents / 100);
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pesos);
}

/**
 * Convierte pesos enteros a centavos para almacenar en BD.
 * @example pesosToCents(150000) → 15000000
 */
export function pesosToCents(pesos: number): number {
  return Math.round(pesos * 100);
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
