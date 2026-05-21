import { Router } from 'express';
import { requireAuth, optionalAuth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { orderController } from './order.controller';
import { createOrderSchema, listOrdersQuerySchema, orderParamsSchema } from './order.schemas';

export const orderRouter: Router = Router();

// POST /orders — autenticado o guest (ambos permitidos)
orderRouter.post('/', optionalAuth, validate(createOrderSchema), orderController.create);

// GET /orders — sólo usuarios autenticados
orderRouter.get(
  '/',
  requireAuth,
  validate(listOrdersQuerySchema, 'query'),
  orderController.list,
);

// GET /orders/:id — auth opcional (propietario o admin)
orderRouter.get(
  '/:id',
  optionalAuth,
  validate(orderParamsSchema, 'params'),
  orderController.getById,
);
