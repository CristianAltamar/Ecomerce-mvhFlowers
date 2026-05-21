import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { addressController } from './address.controller';
import { createAddressSchema, updateAddressSchema, addressParamsSchema } from './address.schemas';

export const addressRouter: Router = Router();

addressRouter.use(requireAuth);

addressRouter.get('/', addressController.list);
addressRouter.post('/', validate(createAddressSchema), addressController.create);
addressRouter.put(
  '/:id',
  validate(addressParamsSchema, 'params'),
  validate(updateAddressSchema),
  addressController.update,
);
addressRouter.delete(
  '/:id',
  validate(addressParamsSchema, 'params'),
  addressController.remove,
);