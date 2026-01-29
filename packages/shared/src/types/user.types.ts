/**
 * User Types
 * User accounts, authentication, and authorization
 */

import type { ProjectRole } from '../enums';
import type { BaseEntity, SoftDeletable } from './common.types';

/**
 * User
 * DB: users table
 */
export interface User extends BaseEntity, SoftDeletable {
  tenantId: string;
  email: string;
  name: string;
  passwordHash: string;
  isActive: boolean;
  lastLoginAt: Date | null;
}

/**
 * Public user (without sensitive fields)
 */
export interface PublicUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
}

/**
 * Permission
 * DB: permissions table
 */
export interface Permission {
  id: string;
  code: string;
  description: string;
}

/**
 * Tenant Role
 * DB: tenant_roles table
 */
export interface TenantRole extends BaseEntity {
  tenantId: string;
  name: string;
  description: string | null;
  permissions: Permission[];
}

/**
 * User Tenant Role (M2M)
 * DB: user_tenant_roles table
 */
export interface UserTenantRole {
  userId: string;
  roleId: string;
  assignedAt: Date;
}

/**
 * Invite
 * DB: invites table
 */
export interface Invite extends BaseEntity {
  tenantId: string;
  email: string;
  role: ProjectRole;
  tokenHash: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  createdBy: string;
}

/**
 * Refresh Token
 * DB: refresh_tokens table
 */
export interface RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

/**
 * Login Attempt
 * DB: login_attempts table
 */
export interface LoginAttempt {
  id: string;
  email: string;
  ipAddress: string;
  userAgent: string | null;
  success: boolean;
  attemptedAt: Date;
}
