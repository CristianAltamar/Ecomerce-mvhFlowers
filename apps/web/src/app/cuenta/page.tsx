'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { authFetch } from '@/lib/auth-fetch';
import { ApiClientError } from '@/lib/api-client';
import { formatCOP } from '@mvh/utils';
import type { Order, Address, Paginated } from '@mvh/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  PROCESSING: 'En preparación',
  OUT_FOR_DELIVERY: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
  REFUNDED: 'bg-red-100 text-red-600',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-xl text-primary mb-5 pb-3 border-b border-primary/10">
      {children}
    </h2>
  );
}

// ─── Sección: Mi información ─────────────────────────────────────────────────

function InfoSection() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.push('/');
  };

  if (!user) return null;

  return (
    <section>
      <SectionHeading>Mi información</SectionHeading>
      <div className="bg-white border border-primary/10 p-6 space-y-3 text-sm">
        <div className="flex gap-4">
          <div className="flex-1">
            <p className="eyebrow mb-1">Nombre</p>
            <p className="text-primary font-medium">{user.firstName} {user.lastName}</p>
          </div>
          <div className="flex-1">
            <p className="eyebrow mb-1">Correo</p>
            <p className="text-primary">{user.email}</p>
          </div>
        </div>
        {user.phone && (
          <div>
            <p className="eyebrow mb-1">Teléfono</p>
            <p className="text-primary">{user.phone}</p>
          </div>
        )}
        <div>
          <p className="eyebrow mb-1">Miembro desde</p>
          <p className="text-primary/60">{formatDate(user.createdAt)}</p>
        </div>
      </div>
      <div className="mt-4">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-xs text-primary/50 hover:text-primary border border-primary/20 px-4 py-2 transition-colors disabled:opacity-40 cursor-pointer"
        >
          {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
        </button>
      </div>
    </section>
  );
}

// ─── Sección: Mis pedidos ────────────────────────────────────────────────────

function OrdersSection() {
  const { data: ordersPage, isLoading } = useQuery<Paginated<Order>>({
    queryKey: ['my-orders'],
    queryFn: () => authFetch<Paginated<Order>>('/orders', { searchParams: { perPage: 50 } }),
  });
  const orders = ordersPage?.data ?? [];

  if (isLoading) {
    return (
      <section>
        <SectionHeading>Mis pedidos</SectionHeading>
        <p className="text-primary/40 animate-pulse text-sm">Cargando pedidos…</p>
      </section>
    );
  }

  return (
    <section>
      <SectionHeading>Mis pedidos</SectionHeading>
      {orders.length === 0 ? (
        <div className="bg-white border border-primary/10 p-8 text-center">
          <p className="text-sm text-primary/50 mb-3">Aún no tienes pedidos.</p>
          <Link href="/categoria/flores" className="btn-primary text-sm px-5 py-2">
            Ver flores
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-primary/10 p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-semibold text-primary text-sm">{order.orderNumber}</p>
                  <p className="text-xs text-primary/50 mt-0.5">{formatDate(order.createdAt)}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 shrink-0 ${STATUS_COLOR[order.status] ?? 'bg-gray-100 text-gray-500'}`}
                >
                  {STATUS_LABEL[order.status] ?? order.status}
                </span>
              </div>

              {/* Items */}
              <div className="space-y-2 mb-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-10 h-10 object-cover border border-primary/10 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-muted shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-primary truncate">
                        {item.productName}
                        {item.variantName && (
                          <span className="text-primary/50"> — {item.variantName}</span>
                        )}
                      </p>
                      <p className="text-xs text-primary/50">
                        {item.quantity} × {formatCOP(item.unitPrice)}
                      </p>
                    </div>
                    <p className="text-xs text-primary font-medium shrink-0">
                      {formatCOP(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-primary/8">
                <p className="text-xs text-primary/50">Total</p>
                <p className="text-sm font-semibold text-primary">{formatCOP(order.total)}</p>
              </div>

              {(order.status === 'PENDING' || order.status === 'PAID') && (
                <div className="mt-3">
                  <Link
                    href={`/pedido/${order.id}`}
                    className="text-xs text-accent hover:underline"
                  >
                    Ver detalle del pedido →
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Sección: Mis direcciones ─────────────────────────────────────────────────

interface AddressFormData {
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string;
  neighborhood: string;
  city: string;
  state: string;
  notes: string;
  isDefault: boolean;
}

const EMPTY_FORM: AddressFormData = {
  label: '',
  recipientName: '',
  phone: '',
  line1: '',
  line2: '',
  neighborhood: '',
  city: 'Barranquilla',
  state: 'Atlántico',
  notes: '',
  isDefault: false,
};

function AddressForm({
  initial,
  onSave,
  onCancel,
  saving,
  error,
}: {
  initial: AddressFormData;
  onSave: (data: AddressFormData) => void;
  onCancel: () => void;
  saving: boolean;
  error: string;
}) {
  const [form, setForm] = useState(initial);
  const set = (key: keyof AddressFormData, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="bg-white border border-primary/10 p-5 space-y-3">
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="eyebrow block mb-1">Etiqueta (ej. Casa, Trabajo)</label>
          <input
            value={form.label}
            onChange={(e) => set('label', e.target.value)}
            placeholder="Casa"
            className="w-full border border-primary/20 bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary/60"
          />
        </div>
        <div>
          <label className="eyebrow block mb-1">Nombre del destinatario *</label>
          <input
            value={form.recipientName}
            onChange={(e) => set('recipientName', e.target.value)}
            required
            className="w-full border border-primary/20 bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary/60"
          />
        </div>
        <div>
          <label className="eyebrow block mb-1">Teléfono *</label>
          <input
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            required
            placeholder="3001234567"
            className="w-full border border-primary/20 bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary/60"
          />
        </div>
        <div>
          <label className="eyebrow block mb-1">Barrio</label>
          <input
            value={form.neighborhood}
            onChange={(e) => set('neighborhood', e.target.value)}
            className="w-full border border-primary/20 bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary/60"
          />
        </div>
      </div>
      <div>
        <label className="eyebrow block mb-1">Dirección *</label>
        <input
          value={form.line1}
          onChange={(e) => set('line1', e.target.value)}
          required
          placeholder="Cra 43 # 75-30"
          className="w-full border border-primary/20 bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary/60"
        />
      </div>
      <div>
        <label className="eyebrow block mb-1">Apto / Piso / Indicaciones adicionales</label>
        <input
          value={form.line2}
          onChange={(e) => set('line2', e.target.value)}
          placeholder="Apto 301"
          className="w-full border border-primary/20 bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary/60"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="eyebrow block mb-1">Ciudad</label>
          <input
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            className="w-full border border-primary/20 bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary/60"
          />
        </div>
        <div>
          <label className="eyebrow block mb-1">Departamento</label>
          <input
            value={form.state}
            onChange={(e) => set('state', e.target.value)}
            className="w-full border border-primary/20 bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary/60"
          />
        </div>
      </div>
      <div>
        <label className="eyebrow block mb-1">Nota de entrega</label>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={2}
          placeholder="Instrucciones para el mensajero…"
          className="w-full border border-primary/20 bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary/60 resize-none"
        />
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => set('isDefault', e.target.checked)}
          className="accent-primary"
        />
        <span className="text-primary/70">Usar como dirección predeterminada</span>
      </label>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.recipientName || !form.phone || !form.line1}
          className="bg-primary text-surface text-xs uppercase tracking-widest px-6 py-2.5 hover:bg-primary-light disabled:opacity-40 cursor-pointer"
        >
          {saving ? 'Guardando…' : 'Guardar dirección'}
        </button>
        <button
          onClick={onCancel}
          className="text-xs text-primary/50 hover:text-primary px-4 py-2 border border-primary/20 transition-colors cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function AddressesSection() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const { data: addresses = [], isLoading } = useQuery<Address[]>({
    queryKey: ['my-addresses'],
    queryFn: () => authFetch<Address[]>('/addresses'),
  });

  const createMutation = useMutation({
    mutationFn: (data: AddressFormData) =>
      authFetch<Address>('/addresses', { method: 'POST', body: { ...data, country: 'CO', postalCode: '' } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
      setShowForm(false);
      setFormError('');
    },
    onError: (err) => setFormError(err instanceof ApiClientError ? err.message : 'Error al guardar'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddressFormData }) =>
      authFetch<Address>(`/addresses/${id}`, { method: 'PUT', body: { ...data, country: 'CO', postalCode: '' } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
      setEditingId(null);
      setFormError('');
    },
    onError: (err) => setFormError(err instanceof ApiClientError ? err.message : 'Error al guardar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => authFetch(`/addresses/${id}`, { method: 'DELETE' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['my-addresses'] }),
  });

  function addressToForm(a: Address): AddressFormData {
    return {
      label: a.label ?? '',
      recipientName: a.recipientName,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2 ?? '',
      neighborhood: a.neighborhood ?? '',
      city: a.city,
      state: a.state,
      notes: a.notes ?? '',
      isDefault: a.isDefault,
    };
  }

  if (isLoading) {
    return (
      <section>
        <SectionHeading>Mis direcciones</SectionHeading>
        <p className="text-primary/40 animate-pulse text-sm">Cargando…</p>
      </section>
    );
  }

  return (
    <section>
      <SectionHeading>Mis direcciones</SectionHeading>

      {addresses.length === 0 && !showForm && (
        <p className="text-sm text-primary/50 mb-4">No tienes direcciones guardadas.</p>
      )}

      <div className="space-y-3 mb-4">
        {addresses.map((addr) =>
          editingId === addr.id ? (
            <AddressForm
              key={addr.id}
              initial={addressToForm(addr)}
              onSave={(data) => updateMutation.mutate({ id: addr.id, data })}
              onCancel={() => { setEditingId(null); setFormError(''); }}
              saving={updateMutation.isPending}
              error={formError}
            />
          ) : (
            <div key={addr.id} className="bg-white border border-primary/10 p-4 flex gap-4">
              <div className="flex-1 text-sm space-y-0.5">
                {addr.label && (
                  <p className="eyebrow text-accent mb-1">{addr.label}</p>
                )}
                {addr.isDefault && (
                  <span className="inline-block text-[10px] uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 mb-1">
                    Predeterminada
                  </span>
                )}
                <p className="text-primary font-medium">{addr.recipientName}</p>
                <p className="text-primary/70">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                {addr.neighborhood && (
                  <p className="text-primary/60">{addr.neighborhood}</p>
                )}
                <p className="text-primary/60">{addr.city}, {addr.state}</p>
                <p className="text-primary/50">Tel: {addr.phone}</p>
                {addr.notes && (
                  <p className="text-primary/40 text-xs mt-1 italic">{addr.notes}</p>
                )}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => { setEditingId(addr.id); setShowForm(false); setFormError(''); }}
                  className="text-xs text-accent hover:underline cursor-pointer"
                >
                  Editar
                </button>
                <button
                  onClick={() => deleteMutation.mutate(addr.id)}
                  disabled={deleteMutation.isPending}
                  className="text-xs text-primary/40 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ),
        )}
      </div>

      {showForm && !editingId ? (
        <AddressForm
          initial={EMPTY_FORM}
          onSave={(data) => createMutation.mutate(data)}
          onCancel={() => { setShowForm(false); setFormError(''); }}
          saving={createMutation.isPending}
          error={formError}
        />
      ) : !editingId ? (
        <button
          onClick={() => setShowForm(true)}
          className="text-xs border border-primary/20 text-primary/60 hover:text-primary hover:border-primary/40 px-4 py-2 transition-colors cursor-pointer"
        >
          + Agregar dirección
        </button>
      ) : null}
    </section>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────

type Tab = 'info' | 'pedidos' | 'direcciones';

const TABS: { key: Tab; label: string }[] = [
  { key: 'info', label: 'Mi información' },
  { key: 'pedidos', label: 'Mis pedidos' },
  { key: 'direcciones', label: 'Mis direcciones' },
];

export default function CuentaPage() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('info');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login?callbackUrl=/cuenta');
    }
  }, [user, isLoading, router]);

  if (!user) {
    return (
      <div className="container-mvh py-20 text-center">
        <p className="text-primary/40 animate-pulse text-sm">Verificando sesión…</p>
      </div>
    );
  }

  return (
    <div className="container-mvh py-12">
      {/* Encabezado */}
      <div className="mb-8">
        <p className="eyebrow text-accent mb-1">Mi cuenta</p>
        <h1 className="font-display text-3xl text-primary">
          Hola, {user.firstName}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-primary/10 mb-8 gap-0">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-3 text-xs uppercase tracking-widest transition-colors cursor-pointer border-b-2 -mb-px ${
              tab === key
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-primary/50 hover:text-primary/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="max-w-2xl">
        {tab === 'info' && <InfoSection />}
        {tab === 'pedidos' && <OrdersSection />}
        {tab === 'direcciones' && <AddressesSection />}
      </div>
    </div>
  );
}
