import { buildThemeCss, DEFAULT_THEME, mergeTheme } from '@/lib/theme';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

async function loadTheme() {
  try {
    const res = await fetch(`${API_URL}/site-content/theme`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return DEFAULT_THEME;
    const json = await res.json();
    const content = json?.data?.content;
    if (!content) return DEFAULT_THEME;
    return mergeTheme(JSON.parse(content));
  } catch {
    return DEFAULT_THEME;
  }
}

/** Server Component — inyecta CSS variables del tema en el documento */
export async function ThemeCssVars() {
  const theme = await loadTheme();
  const css = buildThemeCss(theme);
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
