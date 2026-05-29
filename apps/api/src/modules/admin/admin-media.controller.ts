import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { sendSuccess } from '../../lib/http';
import { adminMediaService } from './admin-media.service';

export const adminMediaController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const perPage = Math.min(100, Math.max(1, Number(req.query.perPage) || 50));
    const result = await adminMediaService.list(page, perPage);
    sendSuccess(res, result);
  }),

  upload: asyncHandler(async (req: Request, res: Response) => {
    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      res.status(400).json({ message: 'No se recibió ningún archivo' });
      return;
    }
    const media = await adminMediaService.upload(file.buffer, file.originalname, file.mimetype);
    sendSuccess(res, media, 201);
  }),

  update: asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const media = await adminMediaService.update(req.params.id, req.body as { filename?: string; alt?: string | null });
    sendSuccess(res, media);
  }),

  sync: asyncHandler(async (_req: Request, res: Response) => {
    const result = await adminMediaService.syncFromCloudinary();
    sendSuccess(res, result);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await adminMediaService.remove(req.params.id!);
    res.status(204).send();
  }),
};
