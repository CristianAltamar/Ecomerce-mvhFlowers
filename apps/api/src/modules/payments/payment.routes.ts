import { Router } from 'express';
import { optionalAuth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { paymentController } from './payment.controller';
import { initiatePaymentSchema, orderIdParamsSchema } from './payment.schemas';

export const paymentRouter: Router = Router();

// POST /orders/:id/pay — iniciar pago (auth opcional, valida propietario)
paymentRouter.post(
  '/orders/:id/pay',
  optionalAuth,
  validate(orderIdParamsSchema, 'params'),
  validate(initiatePaymentSchema),
  paymentController.initiate,
);

// POST /webhooks/bold — notificaciones de Bold.
// El body crudo se captura en el verify de express.json (app.ts) → req.rawBody,
// usado para verificar la firma HMAC sobre los bytes exactos recibidos.
paymentRouter.post('/webhooks/bold', paymentController.boldWebhook);
