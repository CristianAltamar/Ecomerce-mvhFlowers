'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/auth-fetch';
import { ApiClientError } from '@/lib/api-client';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minPurchaseCents: number;
  maxDiscountCents: number | null;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number | null;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
}

interface CouponsResponse {
  items: Coupon[];
  total: number;
  page: number;
  totalPages: number;
}

const INPUT = 'w-full border border-primary/20 bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary/50';
const LABEL = 'block text-xs uppercase tracking-widest text-primary/50 mb-1.5';

const EMPTY: {
  code: string; description: string; type: 'PERCENT' | 'FIXED';
  value: string; minPurchaseCents: string; maxDiscountCents: string;
  usageLimit: string; perUserLimit: string; startsAt: string; expiresAt: string; isActive: boolean;
} = {
  code: '',
  description: '',
  type: 'PERCENT',
  value: '',
  minPurchaseCents: '0',
  maxDiscountCents: '',
  usageLimit: '',
  perUserLimit: '',
  startsAt: '',
  expiresAt: '',
  isActive: true,
};

function formatCOP(cents: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(cents / 100);
}

export default function CuponesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data, isLoading } = useQuery<CouponsResponse>({
    queryKey: ['admin-coupons', page, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), perPage: '20' });
      if (search) params.set('search', search);
      return authFetch(`/admin/coupons?${params}`);
    },
  });

  const saveMutation = useMutation({
    mutationFn: (body: object) =>
      editingId
        ? authFetch(`/admin/coupons/${editingId}`, { method: 'PUT', body })
        : authFetch('/admin/coupons', { method: 'POST', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      closeForm();
    },
    onError: (err) => setFormError(err instanceof ApiClientError ? err.message : 'Error al guardar'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => authFetch(`/admin/coupons/${id}/toggle-active`, { method: 'PATCH' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => authFetch(`/admin/coupons/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      setConfirmDelete(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
  });

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (c: Coupon) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      description: c.description ?? '',
      type: c.type,
      value: String(c.type === 'PERCENT' ? c.value : c.value),
      minPurchaseCents: String(c.minPurchaseCents),
      maxDiscountCents: c.maxDiscountCents != null ? String(c.maxDiscountCents) : '',
      usageLimit: c.usageLimit != null ? String(c.usageLimit) : '',
      perUserLimit: c.perUserLimit != null ? String(c.perUserLimit) : '',
      startsAt: c.startsAt ? c.startsAt.slice(0, 16) : '',
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 16) : '',
      isActive: c.isActive,
    });
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY);
    setFormError('');
  };

  const handleSave = () => {
    if (!form.code || !form.value) { setFormError('Código y valor son requeridos'); return; }
    saveMutation.mutate({
      code: form.code.toUpperCase(),
      description: form.description || undefined,
      type: form.type,
      value: Number(form.value),
      minPurchaseCents: Number(form.minPurchaseCents) || 0,
      maxDiscountCents: form.maxDiscountCents ? Number(form.maxDiscountCents) : null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : null,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      isActive: form.isActive,
    });
  };

  const coupons = data?.items ?? [];

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-primary">Cupones</h1>
        <button onClick={openCreate} className="btn-primary text-sm px-4 py-2">+ Nuevo cupón</button>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-5">
        <input
          type="search"
          placeholder="Buscar por código…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border border-primary/20 bg-white px-3 py-2 text-sm focus:outline-none w-64"
        />
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-primary/20 p-5 mb-6 space-y-4">
          <h2 className="font-semibold text-primary text-sm">{editingId ? 'Editar cupón' : 'Nuevo cupón'}</h2>
          {formError && <p className="text-red-500 text-sm">{formError}</p>}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={LABEL}>Código *</label>
              <input type="text" value={form.code} onChange={f('code')} className={INPUT} placeholder="BIENVENIDA20" />
            </div>
            <div>
              <label className={LABEL}>Tipo *</label>
              <select value={form.type} onChange={f('type')} className={INPUT}>
                <option value="PERCENT">Porcentaje (%)</option>
                <option value="FIXED">Monto fijo (COP)</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>{form.type === 'PERCENT' ? 'Descuento (%)' : 'Descuento (centavos)'} *</label>
              <input type="number" min={1} value={form.value} onChange={f('value')} className={INPUT}
                placeholder={form.type === 'PERCENT' ? '20' : '500000'} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={LABEL}>Compra mínima (centavos)</label>
              <input type="number" min={0} value={form.minPurchaseCents} onChange={f('minPurchaseCents')} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Descuento máximo (centavos)</label>
              <input type="number" min={1} value={form.maxDiscountCents} onChange={f('maxDiscountCents')} className={INPUT} placeholder="Opcional" />
            </div>
            <div>
              <label className={LABEL}>Usos totales máx.</label>
              <input type="number" min={1} value={form.usageLimit} onChange={f('usageLimit')} className={INPUT} placeholder="Ilimitado" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={LABEL}>Usos por usuario</label>
              <input type="number" min={1} value={form.perUserLimit} onChange={f('perUserLimit')} className={INPUT} placeholder="Ilimitado" />
            </div>
            <div>
              <label className={LABEL}>Inicio vigencia</label>
              <input type="datetime-local" value={form.startsAt} onChange={f('startsAt')} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Fin vigencia</label>
              <input type="datetime-local" value={form.expiresAt} onChange={f('expiresAt')} className={INPUT} />
            </div>
          </div>

          <div>
            <label className={LABEL}>Descripción</label>
            <input type="text" value={form.description} onChange={f('description')} className={INPUT} placeholder="Ej: 20% de descuento para nuevos clientes" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
            <span>Activo</span>
          </label>

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saveMutation.isPending} className="btn-primary text-sm px-4 py-2 disabled:opacity-50">
              {saveMutation.isPending ? 'Guardando…' : 'Guardar'}
            </button>
            <button onClick={closeForm} className="btn-outline text-sm px-4 py-2">Cancelar</button>
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
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-primary/50">Código</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-primary/50">Tipo / Valor</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-primary/50">Vigencia</th>
                <th className="text-center px-4 py-3 text-xs uppercase tracking-widest text-primary/50">Usos</th>
                <th className="text-center px-4 py-3 text-xs uppercase tracking-widest text-primary/50">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-mono font-semibold text-primary">{c.code}</p>
                    {c.description && <p className="text-xs text-primary/40 mt-0.5">{c.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-primary/70">
                    {c.type === 'PERCENT'
                      ? `${c.value}%${c.maxDiscountCents ? ` (máx ${formatCOP(c.maxDiscountCents)})` : ''}`
                      : formatCOP(c.value)}
                    {c.minPurchaseCents > 0 && (
                      <p className="text-xs text-primary/40">Mín. {formatCOP(c.minPurchaseCents)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-primary/60">
                    {c.startsAt ? new Date(c.startsAt).toLocaleDateString('es-CO') : '—'}
                    {' → '}
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('es-CO') : '∞'}
                  </td>
                  <td className="px-4 py-3 text-center text-primary/60">
                    {c.usageCount}{c.usageLimit != null ? ` / ${c.usageLimit}` : ''}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleMutation.mutate(c.id)}
                      disabled={toggleMutation.isPending}
                      className={`text-xs px-2 py-0.5 transition-colors ${c.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {c.isActive ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => openEdit(c)} className="text-xs text-accent hover:underline">Editar</button>
                    {confirmDelete === c.id ? (
                      <>
                        <button onClick={() => deleteMutation.mutate(c.id)} className="text-xs text-red-600 hover:underline">Confirmar</button>
                        <button onClick={() => setConfirmDelete(null)} className="text-xs text-primary/40 hover:underline">Cancelar</button>
                      </>
                    ) : (
                      <button onClick={() => setConfirmDelete(c.id)} className="text-xs text-primary/30 hover:text-red-500">Eliminar</button>
                    )}
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-primary/40">No hay cupones.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex gap-2 mt-4 justify-center">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 text-sm border transition-colors ${p === page ? 'bg-primary text-white border-primary' : 'border-primary/20 hover:border-primary/50'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
