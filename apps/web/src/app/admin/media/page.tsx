'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/auth-fetch';
import { useAuthStore } from '@/store/auth-store';

interface MediaItem {
  id: string;
  url: string;
  alt: string | null;
  filename: string;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  createdAt: string;
}

/** "image/png" → "PNG"; si no hay mimeType, usa la extensión del nombre. */
function imageType(m: MediaItem): string {
  if (m.mimeType) {
    const sub = m.mimeType.split('/')[1];
    if (sub) return (sub === 'jpeg' ? 'JPG' : sub).toUpperCase();
  }
  const ext = m.filename.includes('.') ? m.filename.split('.').pop() : '';
  return ext ? ext.toUpperCase() : '—';
}

const INPUT =
  'w-full border border-primary/20 bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors';
const LABEL = 'block text-xs uppercase tracking-widest text-primary/50 mb-1.5';
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPage() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [edit, setEdit] = useState<{ filename: string; alt: string }>({ filename: '', alt: '' });
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const { data, isLoading } = useQuery<{ data: MediaItem[] }>({
    queryKey: ['admin-media'],
    queryFn: () => authFetch<{ data: MediaItem[] }>('/admin/media?perPage=100'),
  });
  const media = data?.data ?? [];
  const selected = media.find((m) => m.id === selectedId) ?? null;

  // Inicializa los campos editables al seleccionar (o cuando llegan los datos de esa imagen
  // tras subirla). Se compara contra el id ya inicializado para no pisar lo que el usuario escribe.
  const editInitRef = useRef<string | null>(null);
  useEffect(() => {
    if (selected && editInitRef.current !== selected.id) {
      editInitRef.current = selected.id;
      setEdit({ filename: selected.filename, alt: selected.alt ?? '' });
    }
  }, [selected]);

  const runSync = useCallback(async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await authFetch<{ imported: number; total: number }>('/admin/media/sync', { method: 'POST' });
      await qc.invalidateQueries({ queryKey: ['admin-media'] });
      setSyncMsg({ ok: true, text: `✓ ${res.imported} nuevas importadas.` });
    } catch {
      setSyncMsg({ ok: false, text: 'Error al sincronizar con Cloudinary.' });
    } finally {
      setSyncing(false);
    }
  }, [qc]);

  // Auto-sincroniza con Cloudinary una sola vez por sesión del navegador
  const autoSyncedRef = useRef(false);
  useEffect(() => {
    if (autoSyncedRef.current) return;
    autoSyncedRef.current = true;
    if (typeof window !== 'undefined' && sessionStorage.getItem('mvh_media_synced') === '1') return;
    void runSync().finally(() => {
      if (typeof window !== 'undefined') sessionStorage.setItem('mvh_media_synced', '1');
    });
  }, [runSync]);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { accessToken } = useAuthStore.getState();
      const res = await fetch(`${API_BASE}/admin/media/upload`, {
        method: 'POST',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('Error al subir la imagen');
      return res.json() as Promise<{ data: MediaItem }>;
    },
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: ['admin-media'] });
      setSelectedId(result.data.id);
    },
  });

  const saveMutation = useMutation({
    mutationFn: (payload: { id: string; filename: string; alt: string }) =>
      authFetch(`/admin/media/${payload.id}`, {
        method: 'PATCH',
        body: { filename: payload.filename, alt: payload.alt || null },
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-media'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => authFetch(`/admin/media/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-media'] });
      setSelectedId(null);
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-2xl text-primary">Biblioteca de medios</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void runSync()}
            disabled={syncing}
            className="text-xs text-primary/60 hover:text-primary border border-primary/20 px-4 py-2 disabled:opacity-40"
          >
            {syncing ? 'Sincronizando…' : '⟳ Sincronizar con Cloudinary'}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="bg-primary text-surface text-xs uppercase tracking-widest px-5 py-2.5 hover:bg-primary-light disabled:opacity-40"
          >
            {uploadMutation.isPending ? 'Subiendo…' : '+ Subir imagen'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadMutation.mutate(file); }}
          />
        </div>
      </div>
      <p className="text-sm text-primary/50 mb-6">
        Al entrar se importan automáticamente las imágenes de Cloudinary que falten. Haz clic en una imagen para editar su nombre y texto alternativo (alt).
        {syncMsg && (
          <span className={syncMsg.ok ? 'text-emerald-600 ml-2' : 'text-red-500 ml-2'}>{syncMsg.text}</span>
        )}
      </p>

      <div className="flex gap-6">
        {/* Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-4 lg:grid-cols-6 gap-3">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="aspect-square bg-primary/5 animate-pulse" />
              ))}
            </div>
          ) : media.length === 0 ? (
            <p className="text-sm text-primary/40">No hay imágenes todavía.</p>
          ) : (
            <div className="grid grid-cols-4 lg:grid-cols-6 gap-3">
              {media.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`relative aspect-square overflow-hidden border-2 transition-all ${
                    selectedId === item.id ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-primary/30'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.alt ?? item.filename} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Panel de edición */}
        {selected && (
          <aside className="w-72 flex-shrink-0 bg-white border border-primary/10 p-4 space-y-4 self-start sticky top-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.url} alt={selected.alt ?? selected.filename} className="w-full aspect-square object-cover border border-primary/10" />
            <div className="text-xs text-primary/50 space-y-0.5">
              <p>Tipo: <span className="text-primary/70 font-medium">{imageType(selected)}</span></p>
              {selected.width && selected.height && <p>{selected.width} × {selected.height} px</p>}
              <p>{formatBytes(selected.sizeBytes)}</p>
            </div>
            <div>
              <label className={LABEL}>Nombre</label>
              <input value={edit.filename} onChange={(e) => setEdit((p) => ({ ...p, filename: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Texto alternativo (alt)</label>
              <input value={edit.alt} onChange={(e) => setEdit((p) => ({ ...p, alt: e.target.value }))} className={INPUT} placeholder="Descripción de la imagen" />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => saveMutation.mutate({ id: selected.id, filename: edit.filename, alt: edit.alt })}
                disabled={saveMutation.isPending}
                className="bg-primary text-surface text-xs uppercase tracking-widest px-5 py-2.5 hover:bg-primary-light disabled:opacity-40"
              >
                {saveMutation.isPending ? 'Guardando…' : 'Guardar'}
              </button>
              {saveMutation.isSuccess && <span className="text-xs text-emerald-600">✓</span>}
            </div>
            <button
              onClick={() => { if (confirm('¿Eliminar esta imagen permanentemente? También se borrará de Cloudinary.')) deleteMutation.mutate(selected.id); }}
              disabled={deleteMutation.isPending}
              className="text-xs text-red-500 hover:underline disabled:opacity-50"
            >
              Eliminar permanentemente
            </button>
            <p className="text-[11px] text-primary/40">
              Si la imagen está en uso por un producto, ese producto quedará sin esa imagen.
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}
