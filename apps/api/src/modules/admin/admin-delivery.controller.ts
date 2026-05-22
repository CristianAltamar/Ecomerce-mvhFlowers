import type { Request, Response } from 'express';
import { adminDeliveryService } from './admin-delivery.service';
import { sendSuccess, sendCreated } from '../../lib/http';
import { asyncHandler } from '../../lib/async-handler';
import type { CreateZoneInput, UpdateZoneInput, CreateSlotInput, UpdateSlotInput, CreateBlockedDateInput } from './admin.schemas';

type ReqWithId = Request<{ id: string }>;

export const adminDeliveryController = {
  // ─── Zones ───────────────────────────────────────────────────────────────────
  listZones: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await adminDeliveryService.listZones());
  }),

  createZone: asyncHandler(async (req: Request, res: Response) => {
    sendCreated(res, await adminDeliveryService.createZone(req.body as CreateZoneInput));
  }),

  updateZone: asyncHandler(async (req: ReqWithId, res: Response) => {
    sendSuccess(res, await adminDeliveryService.updateZone(req.params.id, req.body as UpdateZoneInput));
  }),

  toggleZone: asyncHandler(async (req: ReqWithId, res: Response) => {
    sendSuccess(res, await adminDeliveryService.toggleZone(req.params.id));
  }),

  deleteZone: asyncHandler(async (req: ReqWithId, res: Response) => {
    await adminDeliveryService.deleteZone(req.params.id);
    sendSuccess(res, { message: 'Zona eliminada' });
  }),

  // ─── Slots ───────────────────────────────────────────────────────────────────
  listSlots: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await adminDeliveryService.listSlots());
  }),

  createSlot: asyncHandler(async (req: Request, res: Response) => {
    sendCreated(res, await adminDeliveryService.createSlot(req.body as CreateSlotInput));
  }),

  updateSlot: asyncHandler(async (req: ReqWithId, res: Response) => {
    sendSuccess(res, await adminDeliveryService.updateSlot(req.params.id, req.body as UpdateSlotInput));
  }),

  toggleSlot: asyncHandler(async (req: ReqWithId, res: Response) => {
    sendSuccess(res, await adminDeliveryService.toggleSlot(req.params.id));
  }),

  deleteSlot: asyncHandler(async (req: ReqWithId, res: Response) => {
    await adminDeliveryService.deleteSlot(req.params.id);
    sendSuccess(res, { message: 'Franja eliminada' });
  }),

  // ─── Blocked dates ───────────────────────────────────────────────────────────
  listBlockedDates: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await adminDeliveryService.listBlockedDates());
  }),

  blockDate: asyncHandler(async (req: Request, res: Response) => {
    sendCreated(res, await adminDeliveryService.blockDate(req.body as CreateBlockedDateInput));
  }),

  unblockDate: asyncHandler(async (req: ReqWithId, res: Response) => {
    await adminDeliveryService.unblockDate(req.params.id);
    sendSuccess(res, { message: 'Fecha desbloqueada' });
  }),
};