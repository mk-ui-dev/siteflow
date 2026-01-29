/**
 * Project Types
 * Construction projects and team management
 */

import type { ProjectRole } from '../enums';
import type { BaseEntity, SoftDeletable, UserTracked } from './common.types';
import type { Permission } from './user.types';

/**
 * Project
 * DB: projects table
 */
export interface Project extends BaseEntity, SoftDeletable, UserTracked {
  tenantId: string;
  name: string;
  code: string;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
}

/**
 * Project Member (M2M)
 * DB: project_members table
 */
export interface ProjectMember {
  projectId: string;
  userId: string;
  role: ProjectRole;
  joinedAt: Date;
}

/**
 * Project Role Permission (M2M)
 * DB: project_role_permissions table
 */
export interface ProjectRolePermission {
  role: ProjectRole;
  permissionId: string;
}

/**
 * Project with members (enriched)
 */
export interface ProjectWithMembers extends Project {
  members: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    role: ProjectRole;
    joinedAt: Date;
  }>;
}

/**
 * Project member with permissions
 */
export interface ProjectMemberWithPermissions extends ProjectMember {
  permissions: Permission[];
}
