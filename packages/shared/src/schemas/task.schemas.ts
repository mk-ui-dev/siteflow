/**
 * Task Validation Schemas
 */

import { z } from 'zod';
import { UUIDSchema } from './common.schemas';
import { TaskStatusSchema, EntityTypeSchema } from './enum.schemas';

export const CreateTaskRequestSchema = z.object({
  locationId: UUIDSchema.optional(),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional().default(''),
  requiresInspection: z.boolean().default(false),
  assigneeIds: z.array(UUIDSchema).optional(),
  tagIds: z.array(UUIDSchema).optional(),
});

export const UpdateTaskRequestSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  locationId: UUIDSchema.nullable().optional(),
  requiresInspection: z.boolean().optional(),
});

export const PlanTaskRequestSchema = z.object({
  plannedDate: z.coerce.date(),
  assigneeIds: z.array(UUIDSchema).min(1),
});

export const UpdateTaskStatusRequestSchema = z.object({
  status: TaskStatusSchema,
});

export const CreateTaskBlockRequestSchema = z.object({
  taskId: UUIDSchema,
  blockType: z.enum(['DELIVERY', 'DECISION', 'DEPENDENCY', 'MANUAL']),
  scope: z.enum(['START', 'DONE']),
  refEntityType: EntityTypeSchema.optional(),
  refEntityId: UUIDSchema.optional(),
  message: z.string().min(1).max(500),
});

export const CreateTaskDependencyRequestSchema = z.object({
  blockerTaskId: UUIDSchema,
});
