import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export function buildPaginated<T>(
  data: T[],
  total: number,
  { page, perPage }: PaginationParams,
): PaginatedResult<T> {
  return {
    data,
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage) || 1,
    },
  };
}

export function getSkipTake({ page, perPage }: PaginationParams): { skip: number; take: number } {
  return { skip: (page - 1) * perPage, take: perPage };
}
