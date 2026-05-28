'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/auth-fetch';
import { ApiClientError } from '@/lib/api-client';
import { formatCOP } from '@mvh/utils';
import type { Order } from '@mvh/types';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente de pago',
  PAID: 'Pago confirmado',
  PROCESSING: 'En preparación',
  OUT_FOR_DELIVERY: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  PAID: 'bg-green-50 text-green-800 border-green-200',
  PROCESSING: 'bg-blue-50 text-blue-800 border-blue-200',
  OUT_FOR_DELIVERY: 'bg-blue-50 text-blue-800 border-blue-200',
  DELIVERED: 'bg-green-50 text-green-800 border-green-200',
  CANCELLED: 'bg-red-50 text-red-800 border-red-200',
  REFUNDED: 'bg-gray-50 text-gray-800 border-gray-200',
};

function formatDateES(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const status = searchParams.get('status'); // 'success' | 'cancelled' | null

  const {
    data: order,
    isLoading,
    error,
  } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: () => authFetch<Order>(`/orders/${id}`),
    retry: 1,
    refetchInterval: (query) => {
      // Poll until payment is confirmed after Bold redirect
      if (status === 'success' && query.state.data?.status === 'PENDING') return 4000;
      return false;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-primary/60 animate-pulse">Cargando pedido…</p>
      </div>
    );
  }

  if (error || !order) {
    const msg =
      error instanceof ApiClientError && error.status === 404
        ? 'El pedido no existe o no tienes acceso.'
        : 'No pudimos cargar tu pedido. Intenta de nuevo.';
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="text-accent text-4xl mb-4">✦</div>
        <h1 className="font-display text-2xl text-primary mb-3">Oops</h1>
        <p className="text-primary/60 mb-8">{msg}</p>
        <Link href="/" className="btn-outline">Volver al inicio</Link>
      </div>
    );
  }

  const statusLabel = STATUS_LABELS[order.status] ?? order.status;
  const statusColor = STATUS_COLORS[order.status] ?? 'bg-gray-50 text-gray-800 border-gray-200';
  const isCancelled = status === 'cancelled' || order.status === 'CANCELLED';

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="text-accent text-4xl mb-4">{isCancelled ? '✕' : '✦'}</div>
        <h1 className="font-display text-3xl text-primary mb-2">
          {isCancelled ? 'Pago cancelado' : '¡Gracias por tu pedido!'}
        </h1>
        {!isCancelled && (
          <p className="text-primary/60">
            {order.status === 'PENDING'
              ? 'Estamos procesando tu pago. Te notificaremos cuando sea confirmado.'
              : 'Tu pedido ha sido recibido y está en proceso.'}
          </p>
        )}
        {isCancelled && status === 'cancelled' && (
          <p className="text-primary/60">
            El pago fue cancelado. Tus productos siguen en el carrito si quieres intentarlo de nuevo.
          </p>
        )}
      </div>

      {/* Order number + status */}
      <div className="border border-primary/10 p-6 mb-6">
        <div className="flex items-center justify-between mb-1">
          <span className="eyebrow">Número de pedido</span>
          <span className={`text-xs border px-2 py-0.5 ${statusColor}`}>{statusLabel}</span>
        </div>
        <p className="font-display text-2xl text-primary">{order.orderNumber}</p>
      </div>

      {/* Delivery info */}
      <div className="border border-primary/10 p-6 mb-6 space-y-2">
        <h2 className="font-display text-lg text-primary mb-3">Entrega</h2>
        {order.deliveryDate && (
          <InfoRow label="Fecha" value={formatDateES(order.deliveryDate)} />
        )}
        {order.deliverySlotLabel && (
          <InfoRow label="Horario" value={order.deliverySlotLabel} />
        )}
        {order.deliveryZoneName && (
          <InfoRow label="Zona" value={order.deliveryZoneName} />
        )}
        <InfoRow
          label="Dirección"
          value={`${order.shippingLine1}${order.shippingNeighborhood ? `, ${order.shippingNeighborhood}` : ''}, ${order.shippingCity}`}
        />
        {order.customerNote && (
          <InfoRow label="Nota" value={order.customerNote} />
        )}
      </div>

      {/* Items */}
      <div className="border border-primary/10 p-6 mb-6">
        <h2 className="font-display text-lg text-primary mb-4">Productos</h2>
        <ul className="space-y-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between text-sm">
              <span className="text-primary">
                {item.productName}
                {item.variantName && <span className="text-primary/50 ml-1">· {item.variantName}</span>}
                <span className="text-primary/50 ml-1">× {item.quantity}</span>
              </span>
              <span className="text-primary font-semibold">{formatCOP(item.subtotalCents)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Totals */}
      <div className="border border-primary/10 p-6 mb-8 space-y-2">
        <h2 className="font-display text-lg text-primary mb-3">Totales</h2>
        <InfoRow label="Subtotal" value={formatCOP(order.subtotalCents)} />
        {order.discountCents > 0 && (
          <InfoRow label={`Descuento${order.couponCode ? ` (${order.couponCode})` : ''}`} value={`− ${formatCOP(order.discountCents)}`} />
        )}
        <InfoRow label="Envío" value={formatCOP(order.shippingFeeCents)} />
        <div className="border-t border-primary/10 pt-2">
          <InfoRow label="Total" value={formatCOP(order.totalCents)} bold />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/" className="btn-outline flex-1 text-center">
          Seguir comprando
        </Link>
        {isCancelled && (
          <Link href="/checkout" className="btn-primary flex-1 text-center">
            Intentar de nuevo
          </Link>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm gap-4">
      <span className="text-primary/60 flex-shrink-0">{label}</span>
      <span className={`text-right ${bold ? 'font-display text-base text-primary' : 'text-primary'}`}>{value}</span>
    </div>
  );
}

export default function PedidoPage() {
  return (
    <Suspense>
      <OrderDetail />
    </Suspense>
  );
}
