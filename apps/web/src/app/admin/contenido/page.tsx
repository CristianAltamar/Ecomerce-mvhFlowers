'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/auth-fetch';
import { API_URL } from '@/lib/api-client';

type ContentKey = 'politicas' | 'faq' | 'privacidad';

const TABS: { key: ContentKey; label: string; hint: string }[] = [
  {
    key: 'politicas',
    label: 'Políticas de venta',
    hint: 'HTML. Se muestra en /politicas. Incluye h2, h3, p, ul, li, strong, a.',
  },
  {
    key: 'faq',
    label: 'Preguntas frecuentes',
    hint: 'JSON array: [{"q":"Pregunta","a":"Respuesta"}, …]. Deja vacío para usar las preguntas por defecto.',
  },
  {
    key: 'privacidad',
    label: 'Política de privacidad',
    hint: 'HTML. Se muestra en /privacidad.',
  },
];

function useContent(key: ContentKey) {
  return useQuery<{ key: string; content: string }>({
    queryKey: ['site-content', key],
    queryFn: () => authFetch(`/site-content/${key}`),
    staleTime: 60_000,
  });
}

function ContentEditor({ tab }: { tab: (typeof TABS)[number] }) {
  const qc = useQueryClient();
  const { data, isLoading } = useContent(tab.key);
  const [value, setValue] = useState<string | null>(null);

  const current = value ?? data?.content ?? '';

  const mutation = useMutation({
    mutationFn: (content: string) =>
      fetch(`${API_URL}/admin/site-content/${tab.key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('mvh_access_token') ?? ''}`,
        },
        body: JSON.stringify({ content }),
      }).then((r) => {
        if (!r.ok) throw new Error('Error guardando');
        return r.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['site-content', tab.key] });
      setValue(null);
    },
  });

  if (isLoading) return <p className="text-sm text-burgundy-900/40 animate-pulse">Cargando…</p>;

  return (
    <div className="space-y-3">
      <p className="text-xs text-burgundy-900/50 bg-cream-100 px-3 py-2 border border-burgundy-900/10">
        💡 {tab.hint}
      </p>

      <textarea
        value={current}
        onChange={(e) => setValue(e.target.value)}
        rows={22}
        spellCheck={false}
        className="w-full border border-burgundy-900/20 px-4 py-3 text-sm text-burgundy-900 font-mono bg-white focus:outline-none focus:border-burgundy-900 resize-y"
      />

      <div className="flex items-center gap-3">
        <button
          onClick={() => mutation.mutate(current)}
          disabled={mutation.isPending || value === null}
          className="bg-burgundy-900 text-cream-50 text-xs uppercase tracking-widest px-6 py-2.5 hover:bg-burgundy-950 transition-colors disabled:opacity-40"
        >
          {mutation.isPending ? 'Guardando…' : 'Guardar cambios'}
        </button>
        {value !== null && (
          <button
            onClick={() => setValue(null)}
            className="text-xs text-burgundy-900/40 hover:text-burgundy-900 transition-colors"
          >
            Descartar
          </button>
        )}
        {mutation.isSuccess && (
          <span className="text-xs text-emerald-600">✓ Guardado</span>
        )}
        {mutation.isError && (
          <span className="text-xs text-red-500">Error al guardar</span>
        )}
      </div>
    </div>
  );
}

export default function ContenidoPage() {
  const [activeKey, setActiveKey] = useState<ContentKey>('politicas');
  const activeTab = TABS.find((t) => t.key === activeKey)!;

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="font-display text-2xl text-burgundy-900 mb-2">Contenido del sitio</h1>
      <p className="text-sm text-burgundy-900/50 mb-8">
        Edita las páginas de texto de la tienda. Los cambios se publican inmediatamente.
      </p>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-burgundy-900/10 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveKey(tab.key)}
            className={`px-5 py-2.5 text-sm transition-colors border-b-2 -mb-px ${
              activeKey === tab.key
                ? 'border-burgundy-900 text-burgundy-900 font-semibold'
                : 'border-transparent text-burgundy-900/50 hover:text-burgundy-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Editor */}
      <ContentEditor key={activeKey} tab={activeTab} />

      {/* Links de vista previa */}
      <p className="mt-4 text-xs text-burgundy-900/40">
        Vista previa:{' '}
        <a
          href={activeKey === 'politicas' ? '/politicas' : activeKey === 'faq' ? '/preguntas-frecuentes' : '/privacidad'}
          target="_blank"
          className="underline hover:text-gold-700"
        >
          abrir página →
        </a>
      </p>
    </div>
  );
}
