'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/auth-fetch';
import { ApiClientError } from '@/lib/api-client';
import { formatCOP } from '@mvh/utils';

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  subtotalCents: number;
  discountCents: number;
  shippingFeeCents: number;
  taxCents: number;
  totalCents: number;
  couponCode: string | null;
  deliveryDate: string | null;
  deliverySlotLabel: string | null;
  deliveryZoneName: string | null;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingNeighborhood: string | null;
  shippingCity: string;
  shippingState: string;
  customerNote: string | null;
  guestEmail: string | null;
  userId: string | null;
  items: Array<{
    id: string;
    productName: string;
    variantName: string | null;
    quantity: number;
    unitPriceCents: number;
    subtotalCents: number;
  }>;
  statusHistory: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    createdAt: string;
  }>;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'PAID', label: 'Pagado' },
  { value: 'PROCESSING', label: 'En preparación' },
  { value: 'OUT_FOR_DELIVERY', label: 'En camino' },
  { value: 'DELIVERED', label: 'Entregado' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  OUT_FOR_DELIVERY: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-700',
};

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [statusError, setStatusError] = useState('');

  const { data: order, isLoading } = useQuery<OrderDetail>({
    queryKey: ['admin-order', id],
    queryFn: () => authFetch(`/admin/orders/${id}`),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (body: { status: string; note?: string }) =>
      authFetch(`/admin/orders/${id}/status`, { method: 'PATCH', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      void queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setNewStatus('');
      setStatusNote('');
      setStatusError('');
    },
    onError: (err) => {
      setStatusError(err instanceof ApiClientError ? err.message : 'Error al cambiar estado');
    },
  });

  if (isLoading || !order) {
    return (
      <div className="p-8">
        <p className="text-primary/40 animate-pulse">Cargando pedido…</p>
      </div>
    );
  }

  const statusLabel = STATUS_OPTIONS.find((s) => s.value === order.status)?.label ?? order.status;

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-primary/50 hover:text-primary"
        >
          ← Volver
        </button>
        <h1 className="font-display text-2xl text-primary">{order.orderNumber}</h1>
        <span
          className={`text-xs px-2 py-0.5 ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <section className="bg-white border border-primary/10 p-5">
            <h2 className="font-semibold text-primary text-sm uppercase tracking-widest mb-4">
              Productos
            </h2>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-primary/5">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2">
                      <span className="text-primary">{item.productName}</span>
                      {item.variantName && (
                        <span className="text-primary/50 ml-1">· {item.variantName}</span>
                      )}
                    </td>
                    <td className="py-2 text-right text-primary/50">× {item.quantity}</td>
                    <td className="py-2 text-right text-primary">
                      {formatCOP(item.subtotalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-primary/10 mt-4 pt-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-primary/60">
                <span>Subtotal</span>
                <span>{formatCOP(order.subtotalCents)}</span>
              </div>
              {order.discountCents > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Descuento{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                  <span>− {formatCOP(order.discountCents)}</span>
                </div>
              )}
              <div className="flex justify-between text-primary/60">
                <span>Envío</span>
                <span>{formatCOP(order.shippingFeeCents)}</span>
              </div>
              <div className="flex justify-between font-semibold text-primary pt-1">
                <span>Total</span>
                <span className="font-display text-base">{formatCOP(order.totalCents)}</span>
              </div>
            </div>
          </section>

          {/* Delivery info */}
          <section className="bg-white border border-primary/10 p-5">
            <h2 className="font-semibold text-primary text-sm uppercase tracking-widest mb-4">
              Entrega
            </h2>
            <div className="space-y-1.5 text-sm">
              {order.deliveryDate && (
                <InfoRow
                  label="Fecha"
                  value={new Date(order.deliveryDate).toLocaleDateString('es-CO', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                />
              )}
              {order.deliverySlotLabel && (
                <InfoRow label="Horario" value={order.deliverySlotLabel} />
              )}
              {order.deliveryZoneName && <InfoRow label="Zona" value={order.deliveryZoneName} />}
              <InfoRow
                label="Dirección"
                value={`${order.shippingLine1}${order.shippingNeighborhood ? `, ${order.shippingNeighborhood}` : ''}, ${order.shippingCity}`}
              />
              {order.customerNote && <InfoRow label="Nota" value={order.customerNote} />}
              {order.guestEmail && <InfoRow label="Email invitado" value={order.guestEmail} />}
            </div>
          </section>

          {/* Status history */}
          {order.statusHistory.length > 0 && (
            <section className="bg-white border border-primary/10 p-5">
              <h2 className="font-semibold text-primary text-sm uppercase tracking-widest mb-4">
                Historial de estados
              </h2>
              <ol className="space-y-2">
                {order.statusHistory.map((h) => (
                  <li key={h.id} className="flex gap-3 text-sm">
                    <span className="text-primary/40 flex-shrink-0 w-28 text-xs">
                      {new Date(h.createdAt).toLocaleString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-primary">
                      {h.fromStatus && (
                        <span className="text-primary/50">{STATUS_OPTIONS.find((s) => s.value === h.fromStatus)?.label ?? h.fromStatus} → </span>
                      )}
                      {STATUS_OPTIONS.find((s) => s.value === h.toStatus)?.label ?? h.toStatus}
                      {h.note && <span className="text-primary/50 ml-2">· {h.note}</span>}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        {/* Sidebar: change status */}
        <div className="space-y-4">
          <section className="bg-white border border-primary/10 p-5">
            <h2 className="font-semibold text-primary text-sm uppercase tracking-widest mb-4">
              Cambiar estado
            </h2>
            {statusError && <p className="text-red-500 text-xs mb-2">{statusError}</p>}
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border border-primary/20 bg-white px-3 py-2 text-sm focus:outline-none mb-2"
            >
              <option value="">Selecciona un estado…</option>
              {STATUS_OPTIONS.filter((s) => s.value !== order.status).map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Nota interna (opcional)"
              className="w-full border border-primary/20 bg-white px-3 py-2 text-sm focus:outline-none mb-3"
            />
            <button
              onClick={() =>
                newStatus &&
                updateStatusMutation.mutate({
                  status: newStatus,
                  note: statusNote || undefined,
                })
              }
              disabled={!newStatus || updateStatusMutation.isPending}
              className="btn-primary w-full text-sm disabled:opacity-50"
            >
              {updateStatusMutation.isPending ? 'Actualizando…' : 'Actualizar estado'}
            </button>
          </section>

          <section className="bg-white border border-primary/10 p-5 text-sm space-y-1.5">
            <h2 className="font-semibold text-primary text-xs uppercase tracking-widest mb-3">
              Info del pedido
            </h2>
            <InfoRow
              label="Creado"
              value={new Date(order.createdAt).toLocaleString('es-CO', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            />
            <InfoRow label="Ciudad" value={order.shippingCity} />
          </section>

          <Link
            href={`/pedido/${order.id}`}
            target="_blank"
            className="block text-xs text-center text-accent hover:underline"
          >
            Ver en tienda →
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-primary/50 flex-shrink-0">{label}</span>
      <span className="text-primary text-right">{value}</span>
    </div>
  );
}
