import { buildThemeCss } from '@/lib/theme';
import { getTheme } from '@/lib/theme-server';

/** Server Component — inyecta CSS variables del tema en el documento */
export async function ThemeCssVars() {
  const theme = await getTheme();
  const css = buildThemeCss(theme);
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
