import { prisma } from '../../config/prisma';
import { NotFoundError, ConflictError } from '../../lib/errors';
import type {
  CreateZoneInput,
  UpdateZoneInput,
  CreateSlotInput,
  UpdateSlotInput,
  CreateBlockedDateInput,
} from './admin.schemas';

export const adminDeliveryService = {
  // ─── Zones ───────────────────────────────────────────────────────────────────

  async listZones() {
    return prisma.deliveryZone.findMany({ orderBy: { name: 'asc' } });
  },

  async createZone(data: CreateZoneInput) {
    const existing = await prisma.deliveryZone.findFirst({ where: { name: { equals: data.name, mode: 'insensitive' } } });
    if (existing) throw new ConflictError(`La zona "${data.name}" ya existe`);
    return prisma.deliveryZone.create({ data });
  },

  async updateZone(id: string, data: UpdateZoneInput) {
    const zone = await prisma.deliveryZone.findUnique({ where: { id } });
    if (!zone) throw new NotFoundError('Zona no encontrada');
    return prisma.deliveryZone.update({ where: { id }, data });
  },

  async toggleZone(id: string) {
    const zone = await prisma.deliveryZone.findUnique({ where: { id } });
    if (!zone) throw new NotFoundError('Zona no encontrada');
    return prisma.deliveryZone.update({ where: { id }, data: { isActive: !zone.isActive } });
  },

  async deleteZone(id: string) {
    const zone = await prisma.deliveryZone.findUnique({ where: { id } });
    if (!zone) throw new NotFoundError('Zona no encontrada');
    return prisma.deliveryZone.delete({ where: { id } });
  },

  // ─── Slots ───────────────────────────────────────────────────────────────────

  async listSlots() {
    return prisma.deliverySlot.findMany({ orderBy: { position: 'asc' } });
  },

  async createSlot(data: CreateSlotInput) {
    return prisma.deliverySlot.create({ data });
  },

  async updateSlot(id: string, data: UpdateSlotInput) {
    const slot = await prisma.deliverySlot.findUnique({ where: { id } });
    if (!slot) throw new NotFoundError('Franja horaria no encontrada');
    return prisma.deliverySlot.update({ where: { id }, data });
  },

  async toggleSlot(id: string) {
    const slot = await prisma.deliverySlot.findUnique({ where: { id } });
    if (!slot) throw new NotFoundError('Franja horaria no encontrada');
    return prisma.deliverySlot.update({ where: { id }, data: { isActive: !slot.isActive } });
  },

  async deleteSlot(id: string) {
    const slot = await prisma.deliverySlot.findUnique({ where: { id } });
    if (!slot) throw new NotFoundError('Franja horaria no encontrada');
    return prisma.deliverySlot.delete({ where: { id } });
  },

  // ─── Blocked dates ───────────────────────────────────────────────────────────

  async listBlockedDates() {
    return prisma.blockedDate.findMany({ orderBy: { date: 'asc' } });
  },

  async blockDate(data: CreateBlockedDateInput) {
    // date comes as YYYY-MM-DD; store at midnight UTC
    const date = new Date(`${data.date}T00:00:00.000Z`);
    const existing = await prisma.blockedDate.findFirst({ where: { date } });
    if (existing) throw new ConflictError('Esa fecha ya está bloqueada');
    return prisma.blockedDate.create({ data: { date, reason: data.reason } });
  },

  async unblockDate(id: string) {
    const blocked = await prisma.blockedDate.findUnique({ where: { id } });
    if (!blocked) throw new NotFoundError('Fecha bloqueada no encontrada');
    return prisma.blockedDate.delete({ where: { id } });
  },
};