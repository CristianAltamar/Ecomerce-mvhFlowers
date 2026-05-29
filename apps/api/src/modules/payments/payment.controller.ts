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
    // rawBody es el buffer crudo capturado en el verify de express.json (app.ts).
    // Se usa para verificar la firma HMAC sobre los bytes exactos recibidos.
    const rawBuf = (req as Request & { rawBody?: Buffer }).rawBody;
    const rawBody = rawBuf
      ? rawBuf.toString('utf8')
      : req.body
        ? JSON.stringify(req.body)
        : '';
    const result = await paymentService.handleWebhook(
      rawBody,
      req.headers as Record<string, string | string[] | undefined>,
    );
    // Bold espera 200 OK rápido
    res.status(200).json(result);
  }),
};
