import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../lib/errors';
import { buildPaginated, getSkipTake } from '../../lib/pagination';
import { couponService } from '../coupons/coupon.service';
import { deliveryService } from '../delivery/delivery.service';
import type { CreateOrderInput, ListOrdersQuery } from './order.schemas';

const orderInclude = {
  items: true,
} as const;

function toOrderResponse(order: Awaited<ReturnType<typeof prisma.order.findUniqueOrThrow>>) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    userId: order.userId,
    status: order.status,
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    shippingFeeCents: order.shippingFeeCents,
    taxCents: order.taxCents,
    totalCents: order.totalCents,
    currency: order.currency,
    couponCode: order.couponCode,
    deliveryDate: order.deliveryDate?.toISOString().split('T')[0] ?? null,
    deliverySlotLabel: order.deliverySlotLabel,
    deliveryZoneName: order.deliveryZoneName,
    shippingLine1: order.shippingLine1,
    shippingLine2: order.shippingLine2,
    shippingNeighborhood: order.shippingNeighborhood,
    shippingCity: order.shippingCity,
    shippingState: order.shippingState,
    shippingCountry: order.shippingCountry,
    shippingNotes: order.shippingNotes,
    customerNote: order.customerNote,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.order.count({
    where: { createdAt: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) } },
  });
  const seq = String(count + 1).padStart(5, '0');
  return `MVH-${year}-${seq}`;
}

export const orderService = {
  async create(input: CreateOrderInput, userId?: string) {
    // 1. Validate items and compute subtotal
    const productIds = [...new Set(input.items.map((i) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { images: { orderBy: { position: 'asc' }, take: 1 }, variants: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotalCents = 0;
    const orderItemsData: Array<{
      productId: string;
      variantId?: string;
      productName: string;
      variantName?: string;
      imageUrl?: string;
      unitPriceCents: number;
      quantity: number;
      subtotalCents: number;
    }> = [];

    for (const item of input.items) {
      const product = productMap.get(item.productId);
      if (!product) throw new NotFoundError(`Producto "${item.productId}" no encontrado`);

      let unitPrice = product.priceCents;
      let variantName: string | undefined;
      let availableStock = product.stock;

      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) throw new NotFoundError(`Variante "${item.variantId}" no encontrada`);
        unitPrice = variant.priceCents;
        variantName = variant.name;
        availableStock = variant.stock;
      }

      if (availableStock < item.quantity) {
        throw new BadRequestError(
          `Stock insuficiente para "${product.name}"${variantName ? ` (${variantName})` : ''}. Disponible: ${availableStock}`,
        );
      }

      const lineTotal = unitPrice * item.quantity;
      subtotalCents += lineTotal;
      orderItemsData.push({
        productId: item.productId,
        variantId: item.variantId,
        productName: product.name,
        variantName,
        imageUrl: product.images[0]?.url,
        unitPriceCents: unitPrice,
        quantity: item.quantity,
        subtotalCents: lineTotal,
      });
    }

    // 2. Delivery slot
    const slot = await prisma.deliverySlot.findUnique({
      where: { id: input.deliverySlotId, isActive: true },
    });
    if (!slot) throw new NotFoundError('Franja horaria no encontrada');

    // 3. Validate delivery date (not blocked, not in the past)
    const deliveryDate = new Date(input.deliveryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deliveryDate < today) throw new BadRequestError('La fecha de entrega no puede ser en el pasado');

    const isBlocked = await deliveryService.isDateBlocked(deliveryDate);
    if (isBlocked) throw new BadRequestError('La fecha seleccionada no está disponible para entregas');

    // 4. Delivery zone + shipping fee
    let shippingFeeCents = 0;
    let deliveryZoneName: string | undefined;
    if (input.deliveryZoneId) {
      const zone = await prisma.deliveryZone.findUnique({
        where: { id: input.deliveryZoneId, isActive: true },
      });
      if (!zone) throw new NotFoundError('Zona de entrega no encontrada');
      shippingFeeCents = zone.feeCents;
      deliveryZoneName = zone.name;
    }

    // 5. Coupon
    let discountCents = 0;
    let appliedCouponId: string | undefined;
    let appliedCouponCode: string | undefined;
    if (input.couponCode) {
      const couponResult = await couponService.validate(input.couponCode, subtotalCents);
      discountCents = couponResult.discountCents;
      appliedCouponId = couponResult.coupon.id;
      appliedCouponCode = couponResult.coupon.code;
    }

    // 6. Resolve address
    let shippingData: {
      shippingLine1: string;
      shippingLine2?: string | null;
      shippingNeighborhood?: string | null;
      shippingCity: string;
      shippingState: string;
      shippingCountry: string;
      shippingNotes?: string | null;
    };

    if (input.addressId) {
      if (!userId) throw new BadRequestError('addressId requiere autenticación');
      const addr = await prisma.address.findUnique({ where: { id: input.addressId } });
      if (!addr) throw new NotFoundError('Dirección no encontrada');
      if (addr.userId !== userId) throw new ForbiddenError();
      shippingData = {
        shippingLine1: addr.line1,
        shippingLine2: addr.line2,
        shippingNeighborhood: addr.neighborhood,
        shippingCity: addr.city,
        shippingState: addr.state,
        shippingCountry: addr.country,
        shippingNotes: addr.notes,
      };
    } else if (input.address) {
      shippingData = {
        shippingLine1: input.address.line1,
        shippingLine2: input.address.line2,
        shippingNeighborhood: input.address.neighborhood,
        shippingCity: input.address.city ?? 'Barranquilla',
        shippingState: 'Atlántico',
        shippingCountry: 'CO',
        shippingNotes: input.address.notes,
      };
    } else {
      throw new BadRequestError('Se requiere una dirección de entrega');
    }

    const totalCents = subtotalCents - discountCents + shippingFeeCents;
    const orderNumber = await generateOrderNumber();

    // 7. Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: userId ?? null,
          guestEmail: input.guestEmail,
          guestFirstName: input.guestFirstName,
          guestLastName: input.guestLastName,
          guestPhone: input.guestPhone,
          addressId: input.addressId ?? null,
          ...shippingData,
          deliveryDate: deliveryDate,
          deliverySlotId: input.deliverySlotId,
          deliverySlotLabel: slot.label,
          deliveryZoneId: input.deliveryZoneId ?? null,
          deliveryZoneName: deliveryZoneName ?? null,
          shippingFeeCents,
          subtotalCents,
          discountCents,
          taxCents: 0,
          totalCents,
          couponId: appliedCouponId ?? null,
          couponCode: appliedCouponCode ?? null,
          customerNote: input.customerNote,
          status: 'PENDING',
          items: {
            create: orderItemsData,
          },
          statusHistory: {
            create: { toStatus: 'PENDING', note: 'Pedido creado' },
          },
        },
        include: orderInclude,
      });

      // Decrement stock
      for (const item of input.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            variantId: item.variantId ?? null,
            delta: -item.quantity,
            reason: 'SALE',
            note: `Pedido ${orderNumber}`,
            createdBy: userId ?? null,
          },
        });
      }

      // Increment coupon usage
      if (appliedCouponId) {
        await tx.coupon.update({
          where: { id: appliedCouponId },
          data: { usageCount: { increment: 1 } },
        });
      }

      return created;
    });

    return { ...toOrderResponse(order), items: order.items };
  },

  async list(userId: string, query: ListOrdersQuery) {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        ...getSkipTake(query),
      }),
      prisma.order.count({ where: { userId } }),
    ]);
    return buildPaginated(
      orders.map((o) => ({ ...toOrderResponse(o), items: o.items })),
      total,
      query,
    );
  },

  async getById(orderId: string, userId?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });
    if (!order) throw new NotFoundError('Pedido no encontrado');
    // Allow owner or staff/admin; guests can only see via orderId if no userId set
    if (userId && order.userId && order.userId !== userId) throw new ForbiddenError();
    return { ...toOrderResponse(order), items: order.items };
  },
};