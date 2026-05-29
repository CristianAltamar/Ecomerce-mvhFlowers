import { DEFAULT_THEME, mergeTheme, type ThemeConfig } from '@/lib/theme';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

/**
 * Carga la configuración del tema desde site-content/theme (Server Components).
 * Devuelve DEFAULT_THEME si la API falla o no hay tema guardado.
 */
export async function getTheme(): Promise<ThemeConfig> {
  try {
    const res = await fetch(`${API_URL}/site-content/theme`, { next: { revalidate: 60, tags: ['theme'] } });
    if (!res.ok) return DEFAULT_THEME;
    const json = await res.json();
    const content = json?.data?.content;
    if (!content) return DEFAULT_THEME;
    return mergeTheme(JSON.parse(content));
  } catch {
    return DEFAULT_THEME;
  }
}
