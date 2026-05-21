import type { Request, Response } from 'express';
import { deliveryService } from './delivery.service';
import { sendSuccess } from '../../lib/http';
import { asyncHandler } from '../../lib/async-handler';

export const deliveryController = {
  getZones: asyncHandler(async (_req: Request, res: Response) => {
    const zones = await deliveryService.getZones();
    sendSuccess(res, zones);
  }),

  getSlots: asyncHandler(async (_req: Request, res: Response) => {
    const slots = await deliveryService.getSlots();
    sendSuccess(res, slots);
  }),

  getBlockedDates: asyncHandler(async (_req: Request, res: Response) => {
    const dates = await deliveryService.getBlockedDates();
    sendSuccess(res, dates);
  }),
};