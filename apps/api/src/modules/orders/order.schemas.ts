import { z } from 'zod';

const newAddressSchema = z.object({
  recipientName: z.string().min(2, 'Nombre del destinatario requerido').max(100),
  phone: z.string().min(7, 'Teléfono requerido').max(20),
  line1: z.string().min(5, 'Dirección requerida').max(200),
  line2: z.string().max(100).optional(),
  neighborhood: z.string().max(100).optional(),
  city: z.string().default('Barranquilla'),
  state: z.string().default('Atlántico'),
  notes: z.string().max(300).optional(),
});

export const createOrderSchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          variantId: z.string().optional(),
          quantity: z.number().int().min(1).max(50),
        }),
      )
      .min(1, 'El pedido debe tener al menos un producto'),

    // Address: existente (addressId) o nueva (address)
    addressId: z.string().optional(),
    address: newAddressSchema.optional(),

    deliveryDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
    deliverySlotId: z.string().min(1, 'Franja horaria requerida'),
    deliveryZoneId: z.string().optional(),

    couponCode: z.string().max(50).toUpperCase().optional(),
    customerNote: z.string().max(500).optional(),

    // Guest checkout (opcional si hay auth)
    guestEmail: z.string().email().optional(),
    guestFirstName: z.string().max(80).optional(),
    guestLastName: z.string().max(80).optional(),
    guestPhone: z.string().max(20).optional(),
  })
  .refine((d) => d.addressId || d.address, {
    message: 'Se requiere addressId o los datos de una dirección nueva',
    path: ['address'],
  });

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(10),
});

export const orderParamsSchema = z.object({ id: z.string().min(1) });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;