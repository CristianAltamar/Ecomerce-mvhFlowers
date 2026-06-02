import type { Response } from 'express';
import { addressService } from './address.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../lib/http';
import { asyncHandler } from '../../lib/async-handler';
import type { AuthenticatedRequest } from '../../middlewares/auth';
import type { CreateAddressInput, UpdateAddressInput } from './address.schemas';

export const addressController = {
  list: asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
    const addresses = await addressService.list(req.user.sub);
    sendSuccess(res, addresses);
  }),

  create: asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
    const address = await addressService.create(req.user.sub, req.body as CreateAddressInput);
    sendCreated(res, address);
  }),

  update: asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
    const { id } = res.locals.validatedParams as { id: string };
    const address = await addressService.update(req.user.sub, id, req.body as UpdateAddressInput);
    sendSuccess(res, address);
  }),

  remove: asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
    const { id } = res.locals.validatedParams as { id: string };
    await addressService.delete(req.user.sub, id);
    sendNoContent(res);
  }),
};