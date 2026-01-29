/**
 * User Validation Schemas
 */

import { z } from 'zod';
import { UUIDSchema } from './common.schemas';

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const RegisterRequestSchema = z.object({
  inviteToken: z.string(),
  name: z.string().min(2).max(100),
  password: z.string().min(8).max(72),
});

export const CreateInviteRequestSchema = z.object({
  email: z.string().email(),
  roleId: UUIDSchema,
});

export const UpdateUserRequestSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
});

export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8).max(72),
});
