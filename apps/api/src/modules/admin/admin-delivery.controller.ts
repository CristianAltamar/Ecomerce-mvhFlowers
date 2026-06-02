import type { Request, Response } from 'express';
import { adminDeliveryService } from './admin-delivery.service';
import { sendSuccess, sendCreated } from '../../lib/http';
import { asyncHandler } from '../../lib/async-handler';
import type { CreateZoneInput, UpdateZoneInput, CreateSlotInput, UpdateSlotInput, CreateBlockedDateInput } from './admin.schemas';

export const adminDeliveryController = {
  // ─── Zones ───────────────────────────────────────────────────────────────────
  listZones: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await adminDeliveryService.listZones());
  }),

  createZone: asyncHandler(async (req: Request, res: Response) => {
    sendCreated(res, await adminDeliveryService.createZone(req.body as CreateZoneInput));
  }),

  updateZone: asyncHandler(async (req: Request, res: Response) => {
    const { id } = res.locals.validatedParams as { id: string };
    sendSuccess(res, await adminDeliveryService.updateZone(id, req.body as UpdateZoneInput));
  }),

  toggleZone: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = res.locals.validatedParams as { id: string };
    sendSuccess(res, await adminDeliveryService.toggleZone(id));
  }),

  deleteZone: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = res.locals.validatedParams as { id: string };
    await adminDeliveryService.deleteZone(id);
    sendSuccess(res, { message: 'Zona eliminada' });
  }),

  // ─── Slots ───────────────────────────────────────────────────────────────────
  listSlots: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await adminDeliveryService.listSlots());
  }),

  createSlot: asyncHandler(async (req: Request, res: Response) => {
    sendCreated(res, await adminDeliveryService.createSlot(req.body as CreateSlotInput));
  }),

  updateSlot: asyncHandler(async (req: Request, res: Response) => {
    const { id } = res.locals.validatedParams as { id: string };
    sendSuccess(res, await adminDeliveryService.updateSlot(id, req.body as UpdateSlotInput));
  }),

  toggleSlot: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = res.locals.validatedParams as { id: string };
    sendSuccess(res, await adminDeliveryService.toggleSlot(id));
  }),

  deleteSlot: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = res.locals.validatedParams as { id: string };
    await adminDeliveryService.deleteSlot(id);
    sendSuccess(res, { message: 'Franja eliminada' });
  }),

  // ─── Blocked dates ───────────────────────────────────────────────────────────
  listBlockedDates: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await adminDeliveryService.listBlockedDates());
  }),

  blockDate: asyncHandler(async (req: Request, res: Response) => {
    sendCreated(res, await adminDeliveryService.blockDate(req.body as CreateBlockedDateInput));
  }),

  unblockDate: asyncHandler(async (_req: Request, res: Response) => {
    const { id } = res.locals.validatedParams as { id: string };
    await adminDeliveryService.unblockDate(id);
    sendSuccess(res, { message: 'Fecha desbloqueada' });
  }),
};