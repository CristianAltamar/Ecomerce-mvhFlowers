import { z } from 'zod';

export const createAddressSchema = z.object({
  label: z.string().max(50).optional(),
  recipientName: z.string().min(2, 'Nombre del destinatario requerido').max(100),
  phone: z.string().min(7, 'Teléfono requerido').max(20),
  line1: z.string().min(5, 'Dirección requerida').max(200),
  line2: z.string().max(100).optional(),
  neighborhood: z.string().max(100).optional(),
  city: z.string().default('Barranquilla'),
  state: z.string().default('Atlántico'),
  country: z.string().default('CO'),
  postalCode: z.string().max(20).optional(),
  notes: z.string().max(300).optional(),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();

export const addressParamsSchema = z.object({ id: z.string().min(1) });

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;