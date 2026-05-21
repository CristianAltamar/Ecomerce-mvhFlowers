import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  method: z.enum(['BOLD_CARD', 'BOLD_PSE', 'BOLD_NEQUI', 'CASH_ON_DELIVERY']),
  returnUrl: z.string().url('URL de retorno inválida').optional(),
  cancelUrl: z.string().url('URL de cancelación inválida').optional(),
});

export const orderIdParamsSchema = z.object({ id: z.string().min(1) });

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
