import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError, BadRequestError } from '../../lib/errors';
import type { UpdateOrderStatusInput, AdminOrdersQuery } from './admin.schemas';

const ORDER_LIST_SELECT = {
  id: true,
  orderNumber: true,
  status: true,
  totalCents: true,
  subtotalCents: true,
  discountCents: true,
  shippingFeeCents: true,
  deliveryDate: true,
  shippingCity: true,
  shippingLine1: true,
  userId: true,
  guestEmail: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: { id: true, productName: true, quantity: true, unitPriceCents: true },
  },
} as const;

const ORDER_FULL_INCLUDE = {
  items: { orderBy: { id: 'asc' as const } },
  statusHistory: { orderBy: { createdAt: 'desc' as const } },
  payments: { orderBy: { createdAt: 'desc' as const } },
} as const;

// Allowed transitions (can always cancel from any state except final states)
const FINAL_STATES = new Set(['DELIVERED', 'REFUNDED']);

export const adminOrdersService = {
  async list(query: AdminOrdersQuery) {
    const { page, perPage, status, search } = query;
    const skip = (page - 1) * perPage;

    const where = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search, mode: 'insensitive' as const } },
              { guestEmail: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: ORDER_LIST_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.order.count({ where }),
    ]);

    return { data, meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) } };
  },

  async getById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: ORDER_FULL_INCLUDE,
    });
    if (!order) throw new NotFoundError('Pedido no encontrado');
    return order;
  },

  async updateStatus(id: string, { status, note }: UpdateOrderStatusInput) {
    const order = await this.getById(id);

    if (FINAL_STATES.has(order.status)) {
      throw new BadRequestError(
        `No se puede cambiar el estado de un pedido ${order.status.toLowerCase()}`,
      );
    }

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.order.update({ where: { id }, data: { status } });
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: order.status,
          toStatus: status,
          note: note ?? null,
        },
      });
      return updated;
    });
  },
};
