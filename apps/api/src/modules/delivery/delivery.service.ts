import { prisma } from '../../config/prisma';

export const deliveryService = {
  async getZones() {
    return prisma.deliveryZone.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  },

  async getSlots() {
    return prisma.deliverySlot.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' },
    });
  },

  async getBlockedDates() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return prisma.blockedDate.findMany({
      where: { date: { gte: today } },
      orderBy: { date: 'asc' },
    });
  },

  async isDateBlocked(date: Date): Promise<boolean> {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const blocked = await prisma.blockedDate.findFirst({ where: { date: d } });
    return !!blocked;
  },
};