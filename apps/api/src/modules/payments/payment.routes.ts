import { Router } from 'express';
import express from 'express';
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

// POST /payments/webhooks/bold — recibe notificaciones de Bold
// Usa express.raw() para preservar el body en buffer (necesario para verificar firma HMAC)
paymentRouter.post(
  '/webhooks/bold',
  express.raw({ type: 'application/json' }),
  paymentController.boldWebhook,
);
