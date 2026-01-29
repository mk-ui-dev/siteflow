/**
 * Task Types
 * Core work units with blocking system
 */

import type { TaskStatus, EntityType } from '../enums';
import type { BaseEntity, SoftDeletable, UserTracked } from './common.types';

/**
 * Task
 * DB: tasks table
 */
export interface Task extends BaseEntity, SoftDeletable, UserTracked {
  projectId: string;
  locationId: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  plannedDate: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  requiresInspection: boolean;
}

/**
 * Task Block (SOURCE OF TRUTH for blocking)
 * DB: task_blocks table
 */
export interface TaskBlock extends BaseEntity, UserTracked {
  taskId: string;
  blockType: 'DELIVERY' | 'DECISION' | 'DEPENDENCY' | 'MANUAL';
  scope: 'START' | 'DONE'; // INV-2: START blocks task start, DONE blocks completion
  refEntityType: EntityType | null;
  refEntityId: string | null;
  message: string;
  isActive: boolean;
  resolvedAt: Date | null;
  resolvedBy: string | null;
}

/**
 * Task Assignee (M2M)
 * DB: task_assignees table
 */
export interface TaskAssignee {
  taskId: string;
  userId: string;
  assignedAt: Date;
}

/**
 * Task Watcher (M2M)
 * DB: task_watchers table
 */
export interface TaskWatcher {
  taskId: string;
  userId: string;
  watchedAt: Date;
}

/**
 * Task Dependency (M2M)
 * DB: task_dependencies table
 */
export interface TaskDependency extends BaseEntity, UserTracked {
  blockedTaskId: string;
  blockerTaskId: string;
}

/**
 * Task Status History
 * DB: task_status_history table
 */
export interface TaskStatusHistory extends BaseEntity {
  taskId: string;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus;
  changedAt: Date;
  changedBy: string | null;
}

/**
 * Tag
 * DB: tags table
 */
export interface Tag extends BaseEntity {
  tenantId: string;
  name: string;
  color: string;
}

/**
 * Task Tag (M2M)
 * DB: task_tags table
 */
export interface TaskTag {
  taskId: string;
  tagId: string;
}

/**
 * Task with relations (enriched)
 */
export interface TaskWithRelations extends Task {
  assignees: Array<{
    userId: string;
    userName: string;
    userEmail: string;
  }>;
  watchers: Array<{
    userId: string;
    userName: string;
  }>;
  blocks: TaskBlock[];
  tags: Tag[];
  locationPath: string | null;
}

/**
 * Task with block status (for planner)
 */
export interface TaskWithBlockStatus extends Task {
  isBlocked: boolean;
  activeBlocks: TaskBlock[];
  canStart: boolean; // No blocks with scope='START'
  canComplete: boolean; // No blocks with scope='DONE' AND inspection approved if required
}
