import { z } from 'zod';
import { paginationSchema } from '../../lib/pagination';

export const listProductsQuerySchema = paginationSchema.extend({
  category: z.string().optional(), // slug de categoría
  featured: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  search: z.string().min(1).max(100).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(), // en centavos
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  sort: z
    .enum(['newest', 'price_asc', 'price_desc', 'name_asc'])
    .default('newest'),
});

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
