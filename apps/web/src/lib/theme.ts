export type FontKey = 'display' | 'serif' | 'sans';

export type SectionKey = 'header' | 'footer' | 'hero' | 'tienda' | 'producto' | 'checkout';

/** Estilo personalizable por sección de la tienda. */
export interface SectionStyle {
  background: string; // hex — sobreescribe --th-surface dentro de la sección
  text: string;       // hex — sobreescribe --th-primary dentro de la sección
  accent: string;     // hex — sobreescribe --th-accent dentro de la sección
  headingFont: FontKey;
  bodyFont: FontKey;
}

export interface ThemeConfig {
  colors: {
    primary: string;
    primaryLight: string;
    accent: string;
    accentLight: string;
    surface: string;  // fondo de página (antes "background")
    muted: string;    // superficies/bordes claros
    ink: string;      // tono más oscuro / texto fuerte (antes "text")
  };
  fonts: {
    heading: FontKey;
    body: FontKey;
    ui: FontKey;
  };
  buttons: {
    radius: number;
    uppercase: boolean;
  };
  sections: Record<SectionKey, SectionStyle>;
}

// ─── Defaults ──────────────────────────────────────────────────────────────

const SECTION_DEFAULT: Omit<SectionStyle, 'background' | 'text'> = {
  accent: '#d49328',
  headingFont: 'display',
  bodyFont: 'serif',
};

export const DEFAULT_THEME: ThemeConfig = {
  colors: {
    primary: '#5a1028',
    primaryLight: '#831b3e',
    accent: '#d49328',
    accentLight: '#ecc774',
    surface: '#f7f1e3',
    muted: '#faf5ea',
    ink: '#1a0a10',
  },
  fonts: {
    heading: 'display',
    body: 'serif',
    ui: 'sans',
  },
  buttons: {
    radius: 0,
    uppercase: false,
  },
  sections: {
    // Claras (look por defecto)
    header:   { background: '#f7f1e3', text: '#5a1028', ...SECTION_DEFAULT },
    tienda:   { background: '#f7f1e3', text: '#5a1028', ...SECTION_DEFAULT },
    producto: { background: '#f7f1e3', text: '#5a1028', ...SECTION_DEFAULT },
    checkout: { background: '#f7f1e3', text: '#5a1028', ...SECTION_DEFAULT },
    // Oscuras (invertidas)
    hero:     { background: '#5a1028', text: '#fdfbf7', ...SECTION_DEFAULT },
    footer:   { background: '#3d0a1c', text: '#faf5ea', ...SECTION_DEFAULT },
  },
};

export const FONT_LABELS: Record<FontKey, { name: string; sample: string }> = {
  display: { name: 'Playfair Display', sample: 'font-display' },
  serif:   { name: 'Cormorant Garamond', sample: 'font-serif' },
  sans:    { name: 'Inter', sample: 'font-sans' },
};

export const BUTTON_RADIUS_OPTIONS = [
  { label: 'Cuadrado', value: 0 },
  { label: 'Suave', value: 4 },
  { label: 'Redondeado', value: 8 },
  { label: 'Píldora', value: 9999 },
] as const;

export const SECTION_LABELS: Record<SectionKey, string> = {
  header:   'Header',
  footer:   'Footer',
  hero:     'Hero',
  tienda:   'Tienda',
  producto: 'Página producto',
  checkout: 'Checkout',
};

export const SECTION_ORDER: SectionKey[] = ['header', 'hero', 'tienda', 'producto', 'checkout', 'footer'];

/** Etiquetas de los 7 tokens de color globales (para la pestaña General). */
export const COLOR_LABELS: Record<keyof ThemeConfig['colors'], string> = {
  primary:      'Principal',
  primaryLight: 'Principal claro',
  accent:       'Acento / dorado',
  accentLight:  'Acento claro',
  surface:      'Fondo',
  muted:        'Superficie suave',
  ink:          'Tinta / oscuro',
};

/** CSS var name → next/font CSS variable */
const FONT_VAR_MAP: Record<FontKey, string> = {
  display: 'var(--font-display)',
  serif:   'var(--font-serif)',
  sans:    'var(--font-sans)',
};

/**
 * Convierte "#5a1028" → "90 16 40" (canales RGB separados por espacio).
 * Necesario para que Tailwind aplique modificadores de opacidad
 * sobre las variables del tema: rgb(var(--th-primary-rgb) / <alpha-value>).
 */
export function hexToRgbChannels(hex: string): string {
  const h = hex.replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((ch) => ch + ch).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return '0 0 0';
  return `${r} ${g} ${b}`;
}

/** Emite "--name:hex; --name-rgb:r g b;" para un color. */
function colorVars(name: string, hex: string): string {
  return `--th-${name}:${hex};--th-${name}-rgb:${hexToRgbChannels(hex)};`;
}

export function buildThemeCss(theme: ThemeConfig): string {
  const c = theme.colors;
  const f = theme.fonts;
  const b = theme.buttons;

  const root = [
    ':root{',
    colorVars('primary', c.primary),
    colorVars('primary-light', c.primaryLight),
    colorVars('accent', c.accent),
    colorVars('accent-light', c.accentLight),
    colorVars('surface', c.surface),
    colorVars('muted', c.muted),
    colorVars('ink', c.ink),
    `--th-font-heading:${FONT_VAR_MAP[f.heading]};`,
    `--th-font-body:${FONT_VAR_MAP[f.body]};`,
    `--th-font-ui:${FONT_VAR_MAP[f.ui]};`,
    `--th-btn-radius:${b.radius}px;`,
    `--th-btn-transform:${b.uppercase ? 'uppercase' : 'none'};`,
    '}',
  ].join('');

  // Override por sección: background→surface, text→primary, accent→accent + fuentes.
  const sections = SECTION_ORDER.map((key) => {
    const s = theme.sections[key];
    if (!s) return '';
    return [
      `[data-th-section="${key}"]{`,
      colorVars('surface', s.background),
      colorVars('primary', s.text),
      colorVars('accent', s.accent),
      `--th-font-heading:${FONT_VAR_MAP[s.headingFont]};`,
      `--th-font-body:${FONT_VAR_MAP[s.bodyFont]};`,
      '}',
    ].join('');
  }).join('');

  return root + sections;
}

// ─── Merge / migración ───────────────────────────────────────────────────────

function mergeSection(raw: unknown, fallback: SectionStyle): SectionStyle {
  if (!raw || typeof raw !== 'object') return fallback;
  const s = raw as Partial<SectionStyle>;
  return {
    background:  s.background  ?? fallback.background,
    text:        s.text        ?? fallback.text,
    accent:      s.accent      ?? fallback.accent,
    headingFont: s.headingFont ?? fallback.headingFont,
    bodyFont:    s.bodyFont    ?? fallback.bodyFont,
  };
}

/** Merge de un payload parcial sobre los defaults, con migración del esquema v1. */
export function mergeTheme(raw: unknown): ThemeConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_THEME;
  const src = raw as {
    colors?: Partial<ThemeConfig['colors']> & { background?: string; text?: string };
    fonts?: Partial<ThemeConfig['fonts']>;
    buttons?: Partial<ThemeConfig['buttons']>;
    sections?: Partial<Record<SectionKey, unknown>>;
  };

  const srcColors = src.colors ?? {};
  const colors: ThemeConfig['colors'] = {
    primary:      srcColors.primary      ?? DEFAULT_THEME.colors.primary,
    primaryLight: srcColors.primaryLight ?? DEFAULT_THEME.colors.primaryLight,
    accent:       srcColors.accent       ?? DEFAULT_THEME.colors.accent,
    accentLight:  srcColors.accentLight  ?? DEFAULT_THEME.colors.accentLight,
    // Migración v1: background→surface, text→ink
    surface:      srcColors.surface ?? srcColors.background ?? DEFAULT_THEME.colors.surface,
    muted:        srcColors.muted   ?? DEFAULT_THEME.colors.muted,
    ink:          srcColors.ink     ?? srcColors.text       ?? DEFAULT_THEME.colors.ink,
  };

  const sectionsRaw = src.sections ?? {};
  const sections = SECTION_ORDER.reduce((acc, key) => {
    acc[key] = mergeSection(sectionsRaw[key], DEFAULT_THEME.sections[key]);
    return acc;
  }, {} as Record<SectionKey, SectionStyle>);

  return {
    colors,
    fonts:   { ...DEFAULT_THEME.fonts,   ...(src.fonts ?? {}) },
    buttons: { ...DEFAULT_THEME.buttons, ...(src.buttons ?? {}) },
    sections,
  };
}
