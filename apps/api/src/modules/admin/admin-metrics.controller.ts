import type { Request, Response } from 'express';
import { adminMetricsService } from './admin-metrics.service';
import { sendSuccess } from '../../lib/http';
import { asyncHandler } from '../../lib/async-handler';

export const adminMetricsController = {
  getDashboard: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminMetricsService.getDashboard();
    sendSuccess(res, data);
  }),
};
