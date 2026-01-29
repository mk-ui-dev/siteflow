/**
 * Project Validation Schemas
 */

import { z } from 'zod';
import { UUIDSchema } from './common.schemas';
import { ProjectRoleSchema } from './enum.schemas';

export const CreateProjectRequestSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(20),
  description: z.string().max(2000).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const UpdateProjectRequestSchema = CreateProjectRequestSchema.partial();

export const AddProjectMemberRequestSchema = z.object({
  userId: UUIDSchema,
  role: ProjectRoleSchema,
});

export const CreateLocationRequestSchema = z.object({
  parentId: UUIDSchema.optional(),
  name: z.string().min(1).max(200),
});
