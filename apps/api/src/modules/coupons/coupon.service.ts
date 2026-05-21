import { prisma } from '../../config/prisma';
import { NotFoundError, BadRequestError } from '../../lib/errors';
import { formatCOP } from '@mvh/utils';

export const couponService = {
  async validate(code: string, subtotalCents: number) {
    const coupon = await prisma.coupon.findFirst({
      where: { code: code.toUpperCase(), isActive: true },
    });
    if (!coupon) throw new NotFoundError('Cupón no encontrado o inactivo');

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      throw new BadRequestError('El cupón aún no está vigente');
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      throw new BadRequestError('El cupón ha expirado');
    }
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestError('El cupón ha alcanzado su límite de uso');
    }
    if (subtotalCents < coupon.minPurchaseCents) {
      throw new BadRequestError(
        `Este cupón requiere un pedido mínimo de ${formatCOP(coupon.minPurchaseCents)}`,
      );
    }

    let discountCents: number;
    if (coupon.type === 'PERCENT') {
      discountCents = Math.floor((subtotalCents * coupon.value) / 100);
      if (coupon.maxDiscountCents !== null) {
        discountCents = Math.min(discountCents, coupon.maxDiscountCents);
      }
    } else {
      discountCents = Math.min(coupon.value, subtotalCents);
    }

    return {
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        minPurchaseCents: coupon.minPurchaseCents,
        maxDiscountCents: coupon.maxDiscountCents,
      },
      discountCents,
    };
  },
};