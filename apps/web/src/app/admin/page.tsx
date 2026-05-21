'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/auth-fetch';
import { formatCOP } from '@mvh/utils';

interface DashboardData {
  today: { orders: number; revenueCents: number };
  month: { orders: number; revenueCents: number };
  ordersByStatus: Record<string, number>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalCents: number;
    createdAt: string;
    guestEmail: string | null;
    userId: string | null;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    slug: string;
    stock: number;
    priceCents: number;
  }>;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  PROCESSING: 'En preparación',
  OUT_FOR_DELIVERY: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  OUT_FOR_DELIVERY: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-700',
};

function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white border border-burgundy-900/10 p-5">
      <p className="text-xs text-burgundy-900/50 uppercase tracking-widest mb-1">{label}</p>
      <p className="font-display text-2xl text-burgundy-900">{value}</p>
      <p className="text-xs text-burgundy-900/40 mt-1">{sub}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['admin-metrics'],
    queryFn: () => authFetch('/admin/metrics'),
    refetchInterval: 60_000,
  });

  if (isLoading || !data) {
    return (
      <div className="p-8">
        <p className="text-burgundy-900/40 animate-pulse">Cargando métricas…</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="font-display text-2xl text-burgundy-900 mb-6">Dashboard</h1>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Pedidos hoy"
          value={String(data.today.orders)}
          sub="Excluye cancelados"
        />
        <MetricCard
          label="Ingresos hoy"
          value={formatCOP(data.today.revenueCents)}
          sub="Pedidos pagados"
        />
        <MetricCard
          label="Pedidos este mes"
          value={String(data.month.orders)}
          sub="Excluye cancelados"
        />
        <MetricCard
          label="Ingresos este mes"
          value={formatCOP(data.month.revenueCents)}
          sub="Pedidos pagados"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg text-burgundy-900">Pedidos recientes</h2>
            <Link href="/admin/pedidos" className="text-xs text-gold-700 hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="bg-white border border-burgundy-900/10 divide-y divide-burgundy-900/5">
            {data.recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/pedidos/${order.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-cream-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-burgundy-900">{order.orderNumber}</p>
                  <p className="text-xs text-burgundy-900/50">
                    {order.guestEmail ?? 'Cliente registrado'} ·{' '}
                    {new Date(order.createdAt).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-0.5 ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}
                  >
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  <span className="text-sm text-burgundy-900">{formatCOP(order.totalCents)}</span>
                </div>
              </Link>
            ))}
            {data.recentOrders.length === 0 && (
              <p className="px-4 py-6 text-sm text-burgundy-900/40 text-center">
                No hay pedidos todavía.
              </p>
            )}
          </div>
        </section>

        {/* Low stock */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg text-burgundy-900">Stock bajo (≤ 5)</h2>
            <Link href="/admin/productos" className="text-xs text-gold-700 hover:underline">
              Gestionar →
            </Link>
          </div>
          <div className="bg-white border border-burgundy-900/10 divide-y divide-burgundy-900/5">
            {data.lowStockProducts.map((p) => (
              <Link
                key={p.id}
                href={`/admin/productos/${p.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-cream-50 transition-colors"
              >
                <span className="text-sm text-burgundy-900 truncate mr-4">{p.name}</span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 flex-shrink-0 ${
                    p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {p.stock === 0 ? 'Sin stock' : `${p.stock} uds`}
                </span>
              </Link>
            ))}
            {data.lowStockProducts.length === 0 && (
              <p className="px-4 py-6 text-sm text-burgundy-900/40 text-center">
                Todos los productos tienen stock suficiente.
              </p>
            )}
          </div>
        </section>

        {/* Orders by status */}
        <section className="lg:col-span-2">
          <h2 className="font-display text-lg text-burgundy-900 mb-3">Estado de pedidos (mes)</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <Link
                key={key}
                href={`/admin/pedidos?status=${key}`}
                className="bg-white border border-burgundy-900/10 p-3 text-center hover:border-gold-500/40 transition-colors"
              >
                <p className="font-display text-xl text-burgundy-900">
                  {data.ordersByStatus[key] ?? 0}
                </p>
                <p className="text-xs text-burgundy-900/50 mt-0.5 leading-tight">{label}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
