/**
 * Delivery Validation Schemas
 */

import { z } from 'zod';
import { UUIDSchema } from './common.schemas';
import { DeliveryStatusSchema } from './enum.schemas';

export const CreateDeliveryRequestSchema = z.object({
  taskId: UUIDSchema.optional(),
  locationId: UUIDSchema.optional(),
  supplierName: z.string().min(1).max(200),
  blocksWork: z.boolean().default(false),
  expectedDate: z.coerce.date().optional(),
  items: z.array(
    z.object({
      itemName: z.string().min(1).max(200),
      quantityOrdered: z.number().positive(),
      unit: z.string().min(1).max(50),
    })
  ).min(1),
});

export const UpdateDeliveryStatusRequestSchema = z.object({
  status: DeliveryStatusSchema,
  statusReason: z.string().max(500).optional(),
  deliveredAt: z.coerce.date().optional(),
});

export const UpdateDeliveryItemRequestSchema = z.object({
  quantityDelivered: z.number().nonnegative(),
  isDamaged: z.boolean(),
  notes: z.string().max(500).optional(),
});
