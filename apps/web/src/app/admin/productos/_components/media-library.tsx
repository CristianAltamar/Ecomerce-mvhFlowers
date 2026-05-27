'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/auth-fetch';
import { useAuthStore } from '@/store/auth-store';

interface MediaItem {
  id: string;
  url: string;
  alt: string | null;
  filename: string;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  createdAt: string;
}

interface MediaLibraryProps {
  onSelect: (item: MediaItem) => void;
  onClose: () => void;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibrary({ onSelect, onClose }: MediaLibraryProps) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'library' | 'upload'>('library');
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery<{ data: MediaItem[] }>({
    queryKey: ['admin-media'],
    queryFn: () => authFetch<{ data: MediaItem[] }>('/admin/media?perPage=100'),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { accessToken } = useAuthStore.getState();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/admin/media/upload`, {
        method: 'POST',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? 'Error al subir la imagen');
      }
      return res.json() as Promise<{ data: MediaItem }>;
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-media'] });
      setSelected(result.data);
      setTab('library');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => authFetch(`/admin/media/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-media'] });
      setSelected(null);
    },
  });

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      const file = files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten imágenes');
        return;
      }
      uploadMutation.mutate(file);
    },
    [uploadMutation],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const media = data?.data ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-burgundy-900/10">
          <h2 className="font-display text-xl text-burgundy-900">Biblioteca de medios</h2>
          <button onClick={onClose} className="text-burgundy-900/40 hover:text-burgundy-900 text-2xl leading-none">&times;</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-burgundy-900/10">
          <button
            onClick={() => setTab('library')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              tab === 'library'
                ? 'text-burgundy-900 border-b-2 border-burgundy-900'
                : 'text-burgundy-900/50 hover:text-burgundy-900'
            }`}
          >
            Biblioteca ({media.length})
          </button>
          <button
            onClick={() => setTab('upload')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              tab === 'upload'
                ? 'text-burgundy-900 border-b-2 border-burgundy-900'
                : 'text-burgundy-900/50 hover:text-burgundy-900'
            }`}
          >
            Subir archivo
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Main area */}
          <div className="flex-1 overflow-y-auto p-4">
            {tab === 'upload' ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full max-w-md border-2 border-dashed rounded p-12 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-burgundy-900 bg-burgundy-900/5'
                      : 'border-burgundy-900/20 hover:border-burgundy-900/50'
                  }`}
                >
                  {uploadMutation.isPending ? (
                    <div className="space-y-2">
                      <div className="text-4xl animate-pulse">⏳</div>
                      <p className="text-sm text-burgundy-900/60">Subiendo…</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-5xl text-burgundy-900/30">↑</div>
                      <p className="font-medium text-burgundy-900">Arrastra una imagen aquí</p>
                      <p className="text-sm text-burgundy-900/50">o haz clic para buscar en tus archivos</p>
                      <p className="text-xs text-burgundy-900/40">JPG, PNG, WEBP · Máx. 10 MB</p>
                    </div>
                  )}
                </div>
                {uploadMutation.isError && (
                  <p className="mt-3 text-sm text-red-500">
                    {(uploadMutation.error as Error).message}
                  </p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-burgundy-900/5 animate-pulse" />
                ))}
              </div>
            ) : media.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-burgundy-900/40 text-sm">
                <p>No hay imágenes todavía.</p>
                <button
                  onClick={() => setTab('upload')}
                  className="mt-2 underline hover:text-burgundy-900"
                >
                  Subir la primera
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {media.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className={`relative aspect-square overflow-hidden border-2 transition-all ${
                      selected?.id === item.id
                        ? 'border-burgundy-900 ring-2 ring-burgundy-900/30'
                        : 'border-transparent hover:border-burgundy-900/30'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.alt ?? item.filename}
                      className="w-full h-full object-cover"
                    />
                    {selected?.id === item.id && (
                      <div className="absolute top-1 right-1 bg-burgundy-900 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✓</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar with details */}
          {selected && tab === 'library' && (
            <div className="w-56 border-l border-burgundy-900/10 p-4 flex flex-col gap-3 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.url}
                alt={selected.alt ?? selected.filename}
                className="w-full aspect-square object-cover border border-burgundy-900/10"
              />
              <div className="space-y-1 text-xs text-burgundy-900/60">
                <p className="font-medium text-burgundy-900 truncate">{selected.filename}</p>
                {selected.width && selected.height && (
                  <p>{selected.width} × {selected.height} px</p>
                )}
                <p>{formatBytes(selected.sizeBytes)}</p>
              </div>
              <button
                onClick={() => deleteMutation.mutate(selected.id)}
                disabled={deleteMutation.isPending}
                className="text-xs text-red-500 hover:underline disabled:opacity-50 text-left"
              >
                Eliminar permanentemente
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-burgundy-900/10">
          <button onClick={onClose} className="text-sm text-burgundy-900/60 hover:text-burgundy-900">
            Cancelar
          </button>
          <button
            onClick={() => selected && onSelect(selected)}
            disabled={!selected}
            className="bg-burgundy-900 text-cream-50 px-5 py-2 text-sm hover:bg-burgundy-800 disabled:opacity-40"
          >
            Seleccionar imagen
          </button>
        </div>
      </div>
    </div>
  );
}
