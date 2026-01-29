/**
 * Issue Types
 * Punch-list item management
 */

import type { IssueStatus } from '../enums';
import type { BaseEntity, UserTracked } from './common.types';

/**
 * Issue
 * DB: issues table
 */
export interface Issue extends BaseEntity, UserTracked {
  projectId: string;
  taskId: string | null;
  inspectionId: string | null;
  locationId: string | null;
  title: string;
  description: string;
  status: IssueStatus;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assigneeId: string | null;
  dueDate: Date | null;
  overdue: boolean;
  fixedAt: Date | null;
  verifiedAt: Date | null;
}

/**
 * Issue Status History
 * DB: issue_status_history table
 */
export interface IssueStatusHistory extends BaseEntity {
  issueId: string;
  fromStatus: IssueStatus | null;
  toStatus: IssueStatus;
  changedAt: Date;
  changedBy: string | null;
}

/**
 * Issue with relations (enriched)
 */
export interface IssueWithRelations extends Issue {
  assignee: {
    id: string;
    name: string;
    email: string;
  } | null;
  location: {
    id: string;
    name: string;
    path: string;
  } | null;
  task: {
    id: string;
    title: string;
  } | null;
  inspection: {
    id: string;
    checklistName: string;
  } | null;
}
