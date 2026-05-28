'use client';

import { useState, useTransition } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/auth-fetch';
import {
  DEFAULT_THEME,
  BUTTON_RADIUS_OPTIONS,
  FONT_LABELS,
  COLOR_LABELS,
  SECTION_LABELS,
  SECTION_ORDER,
  mergeTheme,
  type ThemeConfig,
  type FontKey,
  type SectionKey,
  type SectionStyle,
} from '@/lib/theme';

// ─── Tipos de respuesta API ───────────────────────────────────────────────────

interface SiteContentResponse {
  key: string;
  content: string;
}

// ─── Fetch / mutación ────────────────────────────────────────────────────────

async function fetchTheme(): Promise<ThemeConfig> {
  try {
    const data = await authFetch<SiteContentResponse>('/site-content/theme');
    if (!data.content) return DEFAULT_THEME;
    return mergeTheme(JSON.parse(data.content));
  } catch {
    return DEFAULT_THEME;
  }
}

async function saveTheme(theme: ThemeConfig): Promise<SiteContentResponse> {
  return authFetch<SiteContentResponse>('/admin/site-content/theme', {
    method: 'PUT',
    body: { content: JSON.stringify(theme) },
  });
}

const FONT_VAR: Record<FontKey, string> = {
  display: 'var(--font-display)',
  serif:   'var(--font-serif)',
  sans:    'var(--font-sans)',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-sans uppercase tracking-widest text-primary/50 border-b border-primary/10 pb-2 mb-4">
      {children}
    </h2>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-primary/70 w-36">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded border border-primary/20 cursor-pointer p-0.5 bg-white"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
          }}
          maxLength={7}
          className="w-24 border border-primary/20 px-2 py-1.5 text-xs font-mono text-primary focus:outline-none focus:border-primary"
        />
      </div>
    </div>
  );
}

function FontSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: FontKey;
  onChange: (v: FontKey) => void;
}) {
  const keys: FontKey[] = ['display', 'serif', 'sans'];
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-primary/70 w-36">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as FontKey)}
        className="flex-1 border border-primary/20 px-3 py-1.5 text-sm text-primary bg-white focus:outline-none focus:border-primary"
      >
        {keys.map((k) => (
          <option key={k} value={k}>
            {FONT_LABELS[k].name}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Vista previa ──────────────────────────────────────────────────────────────

function Preview({
  caption,
  surface,
  text,
  accent,
  headingFont,
  bodyFont,
  btnRadius,
  btnUppercase,
}: {
  caption: string;
  surface: string;
  text: string;
  accent: string;
  headingFont: FontKey;
  bodyFont: FontKey;
  btnRadius: number;
  btnUppercase: boolean;
}) {
  const wrap = {
    backgroundColor: surface,
    color: text,
    fontFamily: FONT_VAR[bodyFont],
  } as React.CSSProperties;

  const btn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 22px',
    fontSize: '0.8rem',
    fontWeight: 500,
    letterSpacing: '0.05em',
    cursor: 'default',
    borderRadius: `${btnRadius}px`,
    textTransform: btnUppercase ? 'uppercase' : 'none',
  };

  return (
    <div className="sticky top-6">
      <p className="text-xs uppercase tracking-widest text-primary/40 mb-3">{caption}</p>
      <div style={wrap} className="border border-primary/10 p-6 space-y-5 shadow-premium">
        <div>
          <p style={{ fontFamily: FONT_VAR[headingFont], fontSize: '1.5rem', fontWeight: 600 }}>
            MVH Flowers
          </p>
          <p style={{ fontSize: '0.875rem', marginTop: 4, opacity: 0.7 }}>
            Arreglos florales premium con entrega el mismo día
          </p>
        </div>

        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

        <div className="flex flex-wrap gap-3">
          <span style={{ ...btn, background: text, color: surface, border: `1px solid ${text}` }}>
            Comprar ahora
          </span>
          <span style={{ ...btn, background: 'transparent', color: text, border: `1px solid ${text}40` }}>
            Ver catálogo
          </span>
          <span style={{ ...btn, background: accent, color: surface, border: `1px solid ${accent}` }}>
            Contacto
          </span>
        </div>

        <div style={{ border: `1px solid ${text}18`, padding: 12 }}>
          <div style={{ height: 64, background: `${text}10`, marginBottom: 8 }} />
          <p style={{ fontWeight: 600 }}>Bouquet de rosas</p>
          <p style={{ fontSize: '0.75rem', opacity: 0.55, marginTop: 2 }}>
            Entrega el mismo día · Barranquilla
          </p>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: accent, marginTop: 4 }}>
            $85.000 COP
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────

type TabKey = 'general' | 'botones' | SectionKey;

export default function TemasPage() {
  const qc = useQueryClient();
  const [, startTransition] = useTransition();
  const [tab, setTab] = useState<TabKey>('general');

  const { data: saved, isLoading } = useQuery<ThemeConfig>({
    queryKey: ['site-content', 'theme'],
    queryFn: fetchTheme,
    staleTime: 60_000,
  });

  const [draft, setDraft] = useState<ThemeConfig | null>(null);
  const theme = draft ?? saved ?? DEFAULT_THEME;
  const isDirty = draft !== null;

  const mutation = useMutation({
    mutationFn: saveTheme,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['site-content', 'theme'] });
      setDraft(null);
    },
  });

  function update(patch: (prev: ThemeConfig) => ThemeConfig) {
    startTransition(() => {
      setDraft((prev) => patch(prev ?? saved ?? DEFAULT_THEME));
    });
  }

  const setColor   = (key: keyof ThemeConfig['colors'], v: string)            => update((t) => ({ ...t, colors:  { ...t.colors,  [key]: v } }));
  const setFont    = (key: keyof ThemeConfig['fonts'],  v: FontKey)           => update((t) => ({ ...t, fonts:   { ...t.fonts,   [key]: v } }));
  const setButton  = (key: keyof ThemeConfig['buttons'], v: number | boolean) => update((t) => ({ ...t, buttons: { ...t.buttons, [key]: v } }));
  const setSection = (sk: SectionKey, key: keyof SectionStyle, v: string | FontKey) =>
    update((t) => ({ ...t, sections: { ...t.sections, [sk]: { ...t.sections[sk], [key]: v } } }));

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-sm text-primary/40 animate-pulse">Cargando tema…</p>
      </div>
    );
  }

  const colorKeys = Object.keys(COLOR_LABELS) as (keyof ThemeConfig['colors'])[];
  const isSectionTab = tab !== 'general' && tab !== 'botones';
  const section = isSectionTab ? theme.sections[tab as SectionKey] : null;

  function TabButton({ id, label }: { id: TabKey; label: string }) {
    const active = tab === id;
    return (
      <button
        onClick={() => setTab(id)}
        className={`px-4 py-2 text-xs uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors ${
          active
            ? 'border-primary text-primary'
            : 'border-transparent text-primary/40 hover:text-primary/70'
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* Cabecera */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-primary">Tema visual</h1>
          <p className="text-sm text-primary/50 mt-1">
            Personaliza el tema general, los botones y cada sección de la tienda.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {isDirty && (
            <button onClick={() => setDraft(null)} className="text-xs text-primary/40 hover:text-primary transition-colors">
              Descartar
            </button>
          )}
          <button
            onClick={() => setDraft({ ...DEFAULT_THEME })}
            className="text-xs border border-primary/20 px-4 py-2 text-primary/60 hover:text-primary hover:border-primary/40 transition-colors"
          >
            Restablecer defecto
          </button>
          <button
            onClick={() => mutation.mutate(theme)}
            disabled={mutation.isPending || !isDirty}
            className="bg-primary text-surface text-xs uppercase tracking-widest px-6 py-2.5 hover:bg-ink transition-colors disabled:opacity-40"
          >
            {mutation.isPending ? 'Guardando…' : 'Publicar tema'}
          </button>
        </div>
      </div>

      {/* Feedback */}
      {mutation.isError   && <p className="text-xs text-red-500 -mt-2 mb-4">Error al guardar. Intenta de nuevo.</p>}
      {mutation.isSuccess && <p className="text-xs text-emerald-600 -mt-2 mb-4">✓ Tema publicado correctamente</p>}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-primary/10 mb-8 overflow-x-auto">
        <TabButton id="general" label="General" />
        <TabButton id="botones" label="Botones" />
        {SECTION_ORDER.map((sk) => (
          <TabButton key={sk} id={sk} label={SECTION_LABELS[sk]} />
        ))}
      </div>

      {/* Grid: editor | preview */}
      <div className="grid grid-cols-[1fr_320px] gap-8">
        <div className="space-y-8">
          {/* ── General ───────────────────────────────── */}
          {tab === 'general' && (
            <>
              <section>
                <SectionTitle>Colores</SectionTitle>
                <div className="divide-y divide-primary/5">
                  {colorKeys.map((key) => (
                    <ColorRow
                      key={key}
                      label={COLOR_LABELS[key]}
                      value={theme.colors[key]}
                      onChange={(v) => setColor(key, v)}
                    />
                  ))}
                </div>
              </section>

              <section>
                <SectionTitle>Tipografías</SectionTitle>
                <p className="text-xs text-primary/40 mb-3">
                  Las tres fuentes están precargadas. Elige cuál va a cada rol.
                </p>
                <div className="divide-y divide-primary/5">
                  <FontSelect label="Títulos / display" value={theme.fonts.heading} onChange={(v) => setFont('heading', v)} />
                  <FontSelect label="Cuerpo de texto"   value={theme.fonts.body}    onChange={(v) => setFont('body', v)} />
                  <FontSelect label="UI / etiquetas"    value={theme.fonts.ui}      onChange={(v) => setFont('ui', v)} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {(['display', 'serif', 'sans'] as FontKey[]).map((k) => (
                    <div key={k} className="border border-primary/10 p-3 bg-white">
                      <p className={`font-${k} text-sm text-primary leading-tight`}>{FONT_LABELS[k].name}</p>
                      <p className={`font-${k} text-xs text-primary/40 mt-1`}>AaBbCc 0123</p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* ── Botones ───────────────────────────────── */}
          {tab === 'botones' && (
            <section>
              <SectionTitle>Estilo de botones</SectionTitle>
              <div className="space-y-5">
                <div>
                  <p className="text-sm text-primary/70 mb-2">Radio de esquinas</p>
                  <div className="flex gap-2 flex-wrap">
                    {BUTTON_RADIUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setButton('radius', opt.value)}
                        style={{ borderRadius: `${opt.value}px` }}
                        className={`px-4 py-2 text-xs border transition-colors ${
                          theme.buttons.radius === opt.value
                            ? 'bg-primary text-surface border-primary'
                            : 'border-primary/20 text-primary/60 hover:border-primary/50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    role="switch"
                    aria-checked={theme.buttons.uppercase}
                    onClick={() => setButton('uppercase', !theme.buttons.uppercase)}
                    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                      theme.buttons.uppercase ? 'bg-primary' : 'bg-primary/20'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      theme.buttons.uppercase ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                  <span className="text-sm text-primary/70">Texto en mayúsculas</span>
                </div>
              </div>
            </section>
          )}

          {/* ── Sección ───────────────────────────────── */}
          {isSectionTab && section && (
            <>
              <section>
                <SectionTitle>Colores · {SECTION_LABELS[tab as SectionKey]}</SectionTitle>
                <p className="text-xs text-primary/40 mb-3">
                  Estos colores solo aplican dentro de esta sección de la tienda.
                </p>
                <div className="divide-y divide-primary/5">
                  <ColorRow label="Fondo"  value={section.background} onChange={(v) => setSection(tab as SectionKey, 'background', v)} />
                  <ColorRow label="Texto"  value={section.text}       onChange={(v) => setSection(tab as SectionKey, 'text', v)} />
                  <ColorRow label="Acento" value={section.accent}     onChange={(v) => setSection(tab as SectionKey, 'accent', v)} />
                </div>
              </section>

              <section>
                <SectionTitle>Tipografías · {SECTION_LABELS[tab as SectionKey]}</SectionTitle>
                <div className="divide-y divide-primary/5">
                  <FontSelect label="Títulos" value={section.headingFont} onChange={(v) => setSection(tab as SectionKey, 'headingFont', v)} />
                  <FontSelect label="Cuerpo"  value={section.bodyFont}    onChange={(v) => setSection(tab as SectionKey, 'bodyFont', v)} />
                </div>
              </section>
            </>
          )}
        </div>

        {/* ── Preview ──────────────────────────────── */}
        {isSectionTab && section ? (
          <Preview
            caption={`Vista previa · ${SECTION_LABELS[tab as SectionKey]}`}
            surface={section.background}
            text={section.text}
            accent={section.accent}
            headingFont={section.headingFont}
            bodyFont={section.bodyFont}
            btnRadius={theme.buttons.radius}
            btnUppercase={theme.buttons.uppercase}
          />
        ) : (
          <Preview
            caption="Vista previa · General"
            surface={theme.colors.surface}
            text={theme.colors.primary}
            accent={theme.colors.accent}
            headingFont={theme.fonts.heading}
            bodyFont={theme.fonts.body}
            btnRadius={theme.buttons.radius}
            btnUppercase={theme.buttons.uppercase}
          />
        )}
      </div>
    </div>
  );
}
