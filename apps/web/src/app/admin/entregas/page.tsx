'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/auth-fetch';
import { ApiClientError } from '@/lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Zone { id: string; name: string; feeCents: number; description: string | null; neighborhoods: string[]; isActive: boolean; }
interface Slot { id: string; label: string; startTime: string; endTime: string; position: number; isActive: boolean; }
interface BlockedDate { id: string; date: string; reason: string | null; }

// ─── Shared styles ─────────────────────────────────────────────────────────────
const INPUT = 'w-full border border-burgundy-900/20 bg-white px-3 py-2 text-sm focus:outline-none focus:border-burgundy-900/50';
const LABEL = 'block text-xs uppercase tracking-widest text-burgundy-900/50 mb-1.5';

function formatCOP(cents: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(cents / 100);
}

// ─── Zones tab ────────────────────────────────────────────────────────────────

function ZonesTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', feeCents: '', description: '', neighborhoods: '', isActive: true });
  const [formError, setFormError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: zones = [], isLoading } = useQuery<Zone[]>({
    queryKey: ['admin-delivery-zones'],
    queryFn: () => authFetch('/admin/delivery/zones'),
  });

  const saveMutation = useMutation({
    mutationFn: (body: object) =>
      editingId
        ? authFetch(`/admin/delivery/zones/${editingId}`, { method: 'PUT', body })
        : authFetch('/admin/delivery/zones', { method: 'POST', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-delivery-zones'] });
      void queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
      closeForm();
    },
    onError: (err) => setFormError(err instanceof ApiClientError ? err.message : 'Error'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => authFetch(`/admin/delivery/zones/${id}/toggle-active`, { method: 'PATCH' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-delivery-zones'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => authFetch(`/admin/delivery/zones/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      setConfirmDelete(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-delivery-zones'] });
    },
  });

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm({ name: '', feeCents: '', description: '', neighborhoods: '', isActive: true }); setFormError(''); };

  const openEdit = (z: Zone) => {
    setEditingId(z.id);
    setForm({ name: z.name, feeCents: String(z.feeCents), description: z.description ?? '', neighborhoods: z.neighborhoods.join('\n'), isActive: z.isActive });
    setFormError('');
    setShowForm(true);
  };

  const handleSave = () => {
    const nbds = form.neighborhoods.split('\n').map((s) => s.trim()).filter(Boolean);
    if (!form.name || nbds.length === 0) { setFormError('Nombre y al menos un barrio son requeridos'); return; }
    saveMutation.mutate({ name: form.name, feeCents: Number(form.feeCents) || 0, description: form.description || undefined, neighborhoods: nbds, isActive: form.isActive });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { closeForm(); setShowForm(true); }} className="btn-primary text-sm px-4 py-2">+ Nueva zona</button>
      </div>

      {showForm && (
        <div className="bg-white border border-burgundy-900/20 p-5 space-y-4">
          <h3 className="font-semibold text-burgundy-900 text-sm">{editingId ? 'Editar zona' : 'Nueva zona'}</h3>
          {formError && <p className="text-red-500 text-sm">{formError}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Nombre *</label>
              <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={INPUT} placeholder="Norte, Centro, Sur…" />
            </div>
            <div>
              <label className={LABEL}>Tarifa de envío (centavos)</label>
              <input type="number" min={0} value={form.feeCents} onChange={(e) => setForm((p) => ({ ...p, feeCents: e.target.value }))} className={INPUT} placeholder="500000" />
            </div>
          </div>
          <div>
            <label className={LABEL}>Barrios / sectores (uno por línea) *</label>
            <textarea rows={4} value={form.neighborhoods} onChange={(e) => setForm((p) => ({ ...p, neighborhoods: e.target.value }))} className={INPUT} placeholder="El Prado&#10;Altamira&#10;Buenavista" />
          </div>
          <div>
            <label className={LABEL}>Descripción</label>
            <input type="text" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className={INPUT} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
            <span>Activa</span>
          </label>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saveMutation.isPending} className="btn-primary text-sm px-4 py-2 disabled:opacity-50">
              {saveMutation.isPending ? 'Guardando…' : 'Guardar'}
            </button>
            <button onClick={closeForm} className="btn-outline text-sm px-4 py-2">Cancelar</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-burgundy-900/40 animate-pulse text-sm">Cargando…</p>
      ) : (
        <div className="bg-white border border-burgundy-900/10">
          <table className="w-full text-sm">
            <thead className="bg-cream-100/50 border-b border-burgundy-900/10">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-burgundy-900/50">Zona</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-burgundy-900/50">Tarifa</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-burgundy-900/50">Barrios</th>
                <th className="text-center px-4 py-3 text-xs uppercase tracking-widest text-burgundy-900/50">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-burgundy-900/5">
              {zones.map((z) => (
                <tr key={z.id} className="hover:bg-cream-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-burgundy-900">{z.name}</p>
                    {z.description && <p className="text-xs text-burgundy-900/40">{z.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-burgundy-900/70">{formatCOP(z.feeCents)}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-burgundy-900/60">{z.neighborhoods.slice(0, 3).join(', ')}{z.neighborhoods.length > 3 ? ` +${z.neighborhoods.length - 3}` : ''}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleMutation.mutate(z.id)} className={`text-xs px-2 py-0.5 transition-colors ${z.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      {z.isActive ? 'Activa' : 'Inactiva'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => openEdit(z)} className="text-xs text-gold-700 hover:underline">Editar</button>
                    {confirmDelete === z.id ? (
                      <>
                        <button onClick={() => deleteMutation.mutate(z.id)} className="text-xs text-red-600 hover:underline">Confirmar</button>
                        <button onClick={() => setConfirmDelete(null)} className="text-xs text-burgundy-900/40 hover:underline">Cancelar</button>
                      </>
                    ) : (
                      <button onClick={() => setConfirmDelete(z.id)} className="text-xs text-burgundy-900/30 hover:text-red-500">Eliminar</button>
                    )}
                  </td>
                </tr>
              ))}
              {zones.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-burgundy-900/40">No hay zonas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Slots tab ────────────────────────────────────────────────────────────────

function SlotsTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ label: '', startTime: '', endTime: '', position: '0', isActive: true });
  const [formError, setFormError] = useState('');

  const { data: slots = [], isLoading } = useQuery<Slot[]>({
    queryKey: ['admin-delivery-slots'],
    queryFn: () => authFetch('/admin/delivery/slots'),
  });

  const saveMutation = useMutation({
    mutationFn: (body: object) =>
      editingId
        ? authFetch(`/admin/delivery/slots/${editingId}`, { method: 'PUT', body })
        : authFetch('/admin/delivery/slots', { method: 'POST', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-delivery-slots'] });
      closeForm();
    },
    onError: (err) => setFormError(err instanceof ApiClientError ? err.message : 'Error'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => authFetch(`/admin/delivery/slots/${id}/toggle-active`, { method: 'PATCH' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-delivery-slots'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => authFetch(`/admin/delivery/slots/${id}`, { method: 'DELETE' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-delivery-slots'] }),
  });

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm({ label: '', startTime: '', endTime: '', position: '0', isActive: true }); setFormError(''); };

  const openEdit = (s: Slot) => {
    setEditingId(s.id);
    setForm({ label: s.label, startTime: s.startTime, endTime: s.endTime, position: String(s.position), isActive: s.isActive });
    setFormError('');
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.label || !form.startTime || !form.endTime) { setFormError('Todos los campos son requeridos'); return; }
    saveMutation.mutate({ label: form.label, startTime: form.startTime, endTime: form.endTime, position: Number(form.position), isActive: form.isActive });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { closeForm(); setShowForm(true); }} className="btn-primary text-sm px-4 py-2">+ Nueva franja</button>
      </div>

      {showForm && (
        <div className="bg-white border border-burgundy-900/20 p-5 space-y-4">
          <h3 className="font-semibold text-burgundy-900 text-sm">{editingId ? 'Editar franja' : 'Nueva franja'}</h3>
          {formError && <p className="text-red-500 text-sm">{formError}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Etiqueta *</label>
              <input type="text" value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} className={INPUT} placeholder="8:00 AM - 11:00 AM" />
            </div>
            <div>
              <label className={LABEL}>Posición</label>
              <input type="number" min={0} value={form.position} onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))} className={INPUT} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Hora inicio (HH:MM) *</label>
              <input type="time" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Hora fin (HH:MM) *</label>
              <input type="time" value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} className={INPUT} />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
            <span>Activa</span>
          </label>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saveMutation.isPending} className="btn-primary text-sm px-4 py-2 disabled:opacity-50">
              {saveMutation.isPending ? 'Guardando…' : 'Guardar'}
            </button>
            <button onClick={closeForm} className="btn-outline text-sm px-4 py-2">Cancelar</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-burgundy-900/40 animate-pulse text-sm">Cargando…</p>
      ) : (
        <div className="bg-white border border-burgundy-900/10">
          <table className="w-full text-sm">
            <thead className="bg-cream-100/50 border-b border-burgundy-900/10">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-burgundy-900/50">Franja</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-burgundy-900/50">Horario</th>
                <th className="text-center px-4 py-3 text-xs uppercase tracking-widest text-burgundy-900/50">Pos.</th>
                <th className="text-center px-4 py-3 text-xs uppercase tracking-widest text-burgundy-900/50">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-burgundy-900/5">
              {slots.map((s) => (
                <tr key={s.id} className="hover:bg-cream-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-burgundy-900">{s.label}</td>
                  <td className="px-4 py-3 text-burgundy-900/60">{s.startTime} — {s.endTime}</td>
                  <td className="px-4 py-3 text-center text-burgundy-900/60">{s.position}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleMutation.mutate(s.id)} className={`text-xs px-2 py-0.5 transition-colors ${s.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      {s.isActive ? 'Activa' : 'Inactiva'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => openEdit(s)} className="text-xs text-gold-700 hover:underline">Editar</button>
                    <button onClick={() => deleteMutation.mutate(s.id)} className="text-xs text-burgundy-900/30 hover:text-red-500">Eliminar</button>
                  </td>
                </tr>
              ))}
              {slots.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-burgundy-900/40">No hay franjas horarias.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Blocked dates tab ────────────────────────────────────────────────────────

function BlockedDatesTab() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');

  const { data: blocked = [], isLoading } = useQuery<BlockedDate[]>({
    queryKey: ['admin-blocked-dates'],
    queryFn: () => authFetch('/admin/delivery/blocked-dates'),
  });

  const addMutation = useMutation({
    mutationFn: (body: object) => authFetch('/admin/delivery/blocked-dates', { method: 'POST', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-blocked-dates'] });
      setDate('');
      setReason('');
      setFormError('');
    },
    onError: (err) => setFormError(err instanceof ApiClientError ? err.message : 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => authFetch(`/admin/delivery/blocked-dates/${id}`, { method: 'DELETE' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-blocked-dates'] }),
  });

  const handleAdd = () => {
    if (!date) { setFormError('Selecciona una fecha'); return; }
    addMutation.mutate({ date, reason: reason || undefined });
  };

  return (
    <div className="space-y-4">
      {/* Quick-add form */}
      <div className="bg-white border border-burgundy-900/20 p-4 flex gap-4 items-end">
        <div>
          <label className={LABEL}>Fecha *</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={INPUT} />
        </div>
        <div className="flex-1">
          <label className={LABEL}>Motivo (opcional)</label>
          <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} className={INPUT} placeholder="Festivo, mantenimiento…" />
        </div>
        <button onClick={handleAdd} disabled={addMutation.isPending} className="btn-primary text-sm px-4 py-2 disabled:opacity-50 whitespace-nowrap">
          {addMutation.isPending ? 'Bloqueando…' : 'Bloquear fecha'}
        </button>
      </div>
      {formError && <p className="text-red-500 text-sm">{formError}</p>}

      {isLoading ? (
        <p className="text-burgundy-900/40 animate-pulse text-sm">Cargando…</p>
      ) : (
        <div className="bg-white border border-burgundy-900/10">
          <table className="w-full text-sm">
            <thead className="bg-cream-100/50 border-b border-burgundy-900/10">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-burgundy-900/50">Fecha</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-burgundy-900/50">Motivo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-burgundy-900/5">
              {blocked.map((b) => (
                <tr key={b.id} className="hover:bg-cream-50/50">
                  <td className="px-4 py-3 font-medium text-burgundy-900">
                    {new Date(b.date).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                  </td>
                  <td className="px-4 py-3 text-burgundy-900/60">{b.reason ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => deleteMutation.mutate(b.id)} className="text-xs text-burgundy-900/30 hover:text-red-500">Desbloquear</button>
                  </td>
                </tr>
              ))}
              {blocked.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-10 text-center text-sm text-burgundy-900/40">Sin fechas bloqueadas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'zonas' | 'franjas' | 'fechas';

const TABS: { id: Tab; label: string }[] = [
  { id: 'zonas', label: 'Zonas de entrega' },
  { id: 'franjas', label: 'Franjas horarias' },
  { id: 'fechas', label: 'Fechas bloqueadas' },
];

export default function EntregasPage() {
  const [tab, setTab] = useState<Tab>('zonas');

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="font-display text-2xl text-burgundy-900 mb-6">Configuración de entregas</h1>

      {/* Tabs */}
      <div className="flex border-b border-burgundy-900/10 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'border-burgundy-900 text-burgundy-900 font-medium'
                : 'border-transparent text-burgundy-900/40 hover:text-burgundy-900/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'zonas' && <ZonesTab />}
      {tab === 'franjas' && <SlotsTab />}
      {tab === 'fechas' && <BlockedDatesTab />}
    </div>
  );
}
