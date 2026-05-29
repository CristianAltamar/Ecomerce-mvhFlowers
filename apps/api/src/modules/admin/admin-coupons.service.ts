import { prisma } from '../../config/prisma';
import { NotFoundError, ConflictError } from '../../lib/errors';
import type { CreateCouponInput, UpdateCouponInput, AdminCouponsQuery } from './admin.schemas';

export const adminCouponsService = {
  async list(query: AdminCouponsQuery) {
    const { page, perPage, search, isActive } = query;
    const skip = (page - 1) * perPage;

    const where = {
      ...(search
        ? { OR: [{ code: { contains: search.toUpperCase() } }, { description: { contains: search, mode: 'insensitive' as const } }] }
        : {}),
      ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.coupon.findMany({ where, skip, take: perPage, orderBy: { createdAt: 'desc' } }),
      prisma.coupon.count({ where }),
    ]);

    return { items, total, page, perPage, totalPages: Math.ceil(total / perPage) };
  },

  async getById(id: string) {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundError('Cupón no encontrado');
    return coupon;
  },

  async create(data: CreateCouponInput) {
    const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
    if (existing) throw new ConflictError(`El código "${data.code}" ya existe`);

    return prisma.coupon.create({
      data: {
        code: data.code,
        description: data.description,
        type: data.type,
        value: data.value,
        minPurchase: data.minPurchase,
        maxDiscount: data.maxDiscount ?? null,
        usageLimit: data.usageLimit ?? null,
        perUserLimit: data.perUserLimit ?? null,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: data.isActive,
      },
    });
  },

  async update(id: string, data: UpdateCouponInput) {
    await this.getById(id);

    if (data.code) {
      const conflict = await prisma.coupon.findFirst({ where: { code: data.code, NOT: { id } } });
      if (conflict) throw new ConflictError(`El código "${data.code}" ya está en uso`);
    }

    return prisma.coupon.update({
      where: { id },
      data: {
        ...data,
        startsAt: data.startsAt !== undefined ? (data.startsAt ? new Date(data.startsAt) : null) : undefined,
        expiresAt: data.expiresAt !== undefined ? (data.expiresAt ? new Date(data.expiresAt) : null) : undefined,
      },
    });
  },

  async toggleActive(id: string) {
    const coupon = await this.getById(id);
    return prisma.coupon.update({ where: { id }, data: { isActive: !coupon.isActive } });
  },

  async remove(id: string) {
    await this.getById(id);
    return prisma.coupon.delete({ where: { id } });
  },
};