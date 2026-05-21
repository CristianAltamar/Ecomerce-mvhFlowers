import type { Request, Response } from 'express';
import { paymentService } from './payment.service';
import { sendSuccess } from '../../lib/http';
import { asyncHandler } from '../../lib/async-handler';
import type { AuthenticatedRequest } from '../../middlewares/auth';
import type { InitiatePaymentInput } from './payment.schemas';

type ReqWithId = Request<{ id: string }>;

export const paymentController = {
  initiate: asyncHandler(async (req: ReqWithId, res: Response) => {
    const userId = (req as unknown as AuthenticatedRequest).user?.sub;
    const result = await paymentService.initiatePayment(
      req.params.id,
      req.body as InitiatePaymentInput,
      userId,
    );
    sendSuccess(res, result);
  }),

  boldWebhook: asyncHandler(async (req: Request, res: Response) => {
    // rawBody must be the unparsed buffer — set by express.raw() in routes
    const rawBody =
      req.body instanceof Buffer ? req.body.toString('utf8') : JSON.stringify(req.body);
    const result = await paymentService.handleWebhook(
      rawBody,
      req.headers as Record<string, string | string[] | undefined>,
    );
    // Bold expects 200 OK quickly — always respond before heavy processing
    res.status(200).json(result);
  }),
};
