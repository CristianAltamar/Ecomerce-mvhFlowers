import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError } from '../../lib/errors';
import type { CreateAddressInput, UpdateAddressInput } from './address.schemas';

export const addressService = {
  async list(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  },

  async create(userId: string, input: CreateAddressInput) {
    if (input.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return prisma.address.create({ data: { ...input, userId } });
  },

  async update(userId: string, addressId: string, input: UpdateAddressInput) {
    const existing = await prisma.address.findUnique({ where: { id: addressId } });
    if (!existing) throw new NotFoundError('Dirección no encontrada');
    if (existing.userId !== userId) throw new ForbiddenError();

    if (input.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true, id: { not: addressId } },
        data: { isDefault: false },
      });
    }
    return prisma.address.update({ where: { id: addressId }, data: input });
  },

  async delete(userId: string, addressId: string) {
    const existing = await prisma.address.findUnique({ where: { id: addressId } });
    if (!existing) throw new NotFoundError('Dirección no encontrada');
    if (existing.userId !== userId) throw new ForbiddenError();
    await prisma.address.delete({ where: { id: addressId } });
  },
};