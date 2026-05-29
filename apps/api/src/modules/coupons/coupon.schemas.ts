import { z } from 'zod';

export const validateCouponSchema = z.object({
  code: z.string().min(1, 'Código requerido').max(50).toUpperCase(),
  subtotal: z.number().int().positive('El subtotal debe ser mayor a 0'),
});

export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;