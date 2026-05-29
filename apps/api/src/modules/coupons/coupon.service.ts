import { prisma } from '../../config/prisma';
import { NotFoundError, BadRequestError } from '../../lib/errors';
import { formatCOP } from '@mvh/utils';

export const couponService = {
  async validate(code: string, subtotal: number) {
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
    if (subtotal < coupon.minPurchase) {
      throw new BadRequestError(
        `Este cupón requiere un pedido mínimo de ${formatCOP(coupon.minPurchase)}`,
      );
    }

    let discount: number;
    if (coupon.type === 'PERCENT') {
      discount = Math.floor((subtotal * coupon.value) / 100);
      if (coupon.maxDiscount !== null) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = Math.min(coupon.value, subtotal);
    }

    return {
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        minPurchase: coupon.minPurchase,
        maxDiscount: coupon.maxDiscount,
      },
      discount,
    };
  },
};