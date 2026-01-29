/**
 * Common Validation Schemas
 */

import { z } from 'zod';

export const UUIDSchema = z.string().uuid();

export const PaginationParamsSchema = z.object({
  page: z.number().int().min(1).optional(),
  perPage: z.number().int().min(1).max(100).optional(),
  cursor: z.string().optional(),
});

export const SortParamsSchema = z.object({
  field: z.string(),
  direction: z.enum(['ASC', 'DESC']),
});

export const FilterSchema = z.object({
  field: z.string(),
  operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'like']),
  value: z.any(),
});

export const DateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
