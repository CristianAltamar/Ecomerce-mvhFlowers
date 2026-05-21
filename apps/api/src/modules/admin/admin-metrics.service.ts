import { prisma } from '../../config/prisma';

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export const adminMetricsService = {
  async getDashboard() {
    const now = new Date();
    const todayStart = startOfDay(now);
    const monthStart = startOfMonth(now);

    const [
      ordersToday,
      revenueToday,
      ordersMonth,
      revenueMonth,
      ordersByStatus,
      recentOrders,
      lowStockProducts,
    ] = await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: todayStart }, status: { not: 'CANCELLED' } },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: todayStart }, status: { in: ['PAID', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED'] } },
        _sum: { totalCents: true },
      }),
      prisma.order.count({
        where: { createdAt: { gte: monthStart }, status: { not: 'CANCELLED' } },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: monthStart }, status: { in: ['PAID', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED'] } },
        _sum: { totalCents: true },
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
        where: { createdAt: { gte: monthStart } },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalCents: true,
          createdAt: true,
          guestEmail: true,
          userId: true,
        },
      }),
      prisma.product.findMany({
        where: { stock: { lte: 5 }, isActive: true },
        select: { id: true, name: true, slug: true, stock: true, priceCents: true },
        orderBy: { stock: 'asc' },
        take: 10,
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const row of ordersByStatus) {
      statusMap[row.status] = row._count.id;
    }

    return {
      today: {
        orders: ordersToday,
        revenueCents: revenueToday._sum.totalCents ?? 0,
      },
      month: {
        orders: ordersMonth,
        revenueCents: revenueMonth._sum.totalCents ?? 0,
      },
      ordersByStatus: statusMap,
      recentOrders,
      lowStockProducts,
    };
  },
};
