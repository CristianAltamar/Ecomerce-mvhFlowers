'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/auth-fetch';
import { ApiClientError } from '@/lib/api-client';

interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  position: number;
  isActive: boolean;
  parent: { id: string; name: string; slug: string } | null;
  _count: { children: number; products: number };
}

const INPUT =
  'w-full border border-primary/20 bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary/50';
const LABEL = 'block text-xs uppercase tracking-widest text-primary/50 mb-1.5';

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  parentId: '',
  position: '0',
  isActive: true,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export default function CategoriasPage() {
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const { data: categories = [], isLoading } = useQuery<AdminCategory[]>({
    queryKey: ['admin-categories'],
    queryFn: () => authFetch('/admin/categories'),
  });

  const saveMutation = useMutation({
    mutationFn: (body: object) =>
      editingId
        ? authFetch(`/admin/categories/${editingId}`, { method: 'PUT', body })
        : authFetch('/admin/categories', { method: 'POST', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      setFormError('');
    },
    onError: (err) => {
      setFormError(err instanceof ApiClientError ? err.message : 'Error al guardar');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) =>
      authFetch(`/admin/categories/${id}/toggle-active`, { method: 'PATCH' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
  });

  const f =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm((p) => ({ ...p, name, ...(!editingId ? { slug: slugify(name) } : {}) }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (cat: AdminCategory) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? '',
      imageUrl: cat.imageUrl ?? '',
      parentId: cat.parentId ?? '',
      position: String(cat.position),
      isActive: cat.isActive,
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name || !form.slug) {
      setFormError('Nombre y slug son requeridos');
      return;
    }
    saveMutation.mutate({
      name: form.name,
      slug: form.slug,
      description: form.description || undefined,
      imageUrl: form.imageUrl || undefined,
      parentId: form.parentId || null,
      position: Number(form.position),
      isActive: form.isActive,
    });
  };

  const rootCategories = categories.filter((c) => !c.parentId);

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-primary">Categorías</h1>
        <button onClick={openCreate} className="btn-primary text-sm px-4 py-2">
          + Nueva categoría
        </button>
      </div>

      {/* Create/edit form */}
      {showForm && (
        <div className="bg-white border border-primary/20 p-5 mb-6 space-y-4">
          <h2 className="font-semibold text-primary text-sm">
            {editingId ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          {formError && (
            <p className="text-red-500 text-sm">{formError}</p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Nombre *</label>
              <input type="text" value={form.name} onChange={handleNameChange} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Slug *</label>
              <input type="text" value={form.slug} onChange={f('slug')} className={INPUT} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Categoría padre</label>
              <select value={form.parentId} onChange={f('parentId')} className={INPUT}>
                <option value="">Sin padre (raíz)</option>
                {rootCategories
                  .filter((c) => c.id !== editingId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Posición</label>
              <input type="number" min={0} value={form.position} onChange={f('position')} className={INPUT} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Descripción</label>
            <input type="text" value={form.description} onChange={f('description')} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>URL imagen</label>
            <input type="url" value={form.imageUrl} onChange={f('imageUrl')} className={INPUT} placeholder="https://…" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
            />
            <span>Activa (visible en tienda)</span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="btn-outline text-sm px-4 py-2"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <p className="text-primary/40 animate-pulse">Cargando…</p>
      ) : (
        <div className="bg-white border border-primary/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-primary/10">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-primary/50">Categoría</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-primary/50">Padre</th>
                <th className="text-center px-4 py-3 text-xs uppercase tracking-widest text-primary/50">Hijos</th>
                <th className="text-center px-4 py-3 text-xs uppercase tracking-widest text-primary/50">Productos</th>
                <th className="text-center px-4 py-3 text-xs uppercase tracking-widest text-primary/50">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-primary">{cat.name}</p>
                    <p className="text-xs text-primary/40">{cat.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-primary/60 text-sm">
                    {cat.parent?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-primary/60">{cat._count.children}</td>
                  <td className="px-4 py-3 text-center text-primary/60">{cat._count.products}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleMutation.mutate(cat.id)}
                      disabled={toggleMutation.isPending}
                      className={`text-xs px-2 py-0.5 transition-colors ${
                        cat.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {cat.isActive ? 'Activa' : 'Inactiva'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(cat)} className="text-xs text-accent hover:underline">
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-primary/40">
                    No hay categorías.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
