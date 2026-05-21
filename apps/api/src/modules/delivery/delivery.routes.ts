import { Router } from 'express';
import { deliveryController } from './delivery.controller';

export const deliveryRouter: Router = Router();

deliveryRouter.get('/zones', deliveryController.getZones);
deliveryRouter.get('/slots', deliveryController.getSlots);
deliveryRouter.get('/blocked-dates', deliveryController.getBlockedDates);