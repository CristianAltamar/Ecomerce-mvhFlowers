'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/auth-fetch';
import { formatCOP } from '@mvh/utils';

interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  deliveryDate: string | null;
  shippingCity: string;
  guestEmail: string | null;
  userId: string | null;
  createdAt: string;
  items: Array<{ id: string; productName: string; quantity: number }>;
}

interface OrdersData {
  data: AdminOrder[];
  meta: { page: number; perPage: number; total: number; totalPages: number };
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
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

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get('page') ?? 1);
  const status = searchParams.get('status') ?? '';
  const search = searchParams.get('search') ?? '';

  const { data, isLoading } = useQuery<OrdersData>({
    queryKey: ['admin-orders', page, status, search],
    queryFn: () =>
      authFetch('/admin/orders', {
        searchParams: {
          page,
          perPage: 20,
          ...(status ? { status } : {}),
          ...(search ? { search } : {}),
        },
      }),
    refetchInterval: 30_000,
  });

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    router.push(`/admin/pedidos?${params.toString()}`);
  };

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="font-display text-2xl text-primary mb-6">Pedidos</h1>

      {/* Status tabs */}
      <div className="flex gap-1 mb-5 flex-wrap">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setParam('status', opt.value)}
            className={`px-3 py-1.5 text-xs transition-colors ${
              status === opt.value
                ? 'bg-primary text-surface'
                : 'bg-white border border-primary/20 text-primary/60 hover:text-primary'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-5">
        <input
          type="text"
          defaultValue={search}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setParam('search', (e.target as HTMLInputElement).value);
            }
          }}
          placeholder="Buscar por número de pedido o email…"
          className="flex-1 max-w-sm border border-primary/20 bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-primary/40 animate-pulse py-10">Cargando…</p>
      ) : (
        <>
          <div className="bg-white border border-primary/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-primary/10">
                <tr>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-primary/50">Pedido</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-primary/50">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-primary/50">Entrega</th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-widest text-primary/50">Total</th>
                  <th className="text-center px-4 py-3 text-xs uppercase tracking-widest text-primary/50">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {data?.data.map((order) => (
                  <tr key={order.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-primary">{order.orderNumber}</p>
                      <p className="text-xs text-primary/40">
                        {new Date(order.createdAt).toLocaleString('es-CO', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-primary/80">
                        {order.guestEmail ?? (order.userId ? 'Registrado' : '—')}
                      </p>
                      <p className="text-xs text-primary/40">{order.shippingCity}</p>
                    </td>
                    <td className="px-4 py-3 text-primary/60">
                      {order.deliveryDate
                        ? new Date(order.deliveryDate).toLocaleDateString('es-CO', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">
                      {formatCOP(order.total)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-xs px-2 py-0.5 ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}
                      >
                        {STATUS_OPTIONS.find((s) => s.value === order.status)?.label ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="text-xs text-accent hover:underline"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-primary/40">
                      No hay pedidos con esos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-primary/50">
                {data.meta.total} pedidos · página {data.meta.page} de {data.meta.totalPages}
              </span>
              <div className="flex gap-2">
                {data.meta.page > 1 && (
                  <button
                    onClick={() => setParam('page', String(page - 1))}
                    className="px-3 py-1 border border-primary/20 hover:border-primary/50"
                  >
                    ← Anterior
                  </button>
                )}
                {data.meta.page < data.meta.totalPages && (
                  <button
                    onClick={() => setParam('page', String(page + 1))}
                    className="px-3 py-1 border border-primary/20 hover:border-primary/50"
                  >
                    Siguiente →
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function PedidosPage() {
  return (
    <Suspense>
      <OrdersContent />
    </Suspense>
  );
}
