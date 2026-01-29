/**
 * Decision Types
 * Decision approval workflow
 */

import type { DecisionStatus, EntityType } from '../enums';
import type { BaseEntity, UserTracked } from './common.types';

/**
 * Decision
 * DB: decisions table
 */
export interface Decision extends BaseEntity, UserTracked {
  projectId: string;
  relatedType: EntityType | null;
  relatedId: string | null;
  subject: string;
  problem: string;
  status: DecisionStatus;
  blocksWork: boolean; // INV-9: If true + status=PENDING_APPROVAL → creates task_blocks
  decisionOwnerId: string | null;
  dueDate: Date | null;
  approvalReason: string | null;
}

/**
 * Decision Option
 * DB: decision_options table
 */
export interface DecisionOption extends BaseEntity {
  decisionId: string;
  title: string;
  description: string | null;
  pros: string | null;
  cons: string | null;
  estimatedCost: number | null;
  estimatedDays: number | null;
  position: number;
}

/**
 * Decision Approval
 * DB: decision_approvals table
 */
export interface DecisionApproval extends BaseEntity {
  decisionId: string;
  approverId: string;
  approved: boolean | null; // null = pending, true = approved, false = rejected
  comment: string | null;
  decidedAt: Date | null;
}

/**
 * Decision with options and approvals (enriched)
 */
export interface DecisionWithDetails extends Decision {
  options: DecisionOption[];
  approvals: Array<{
    approver: {
      id: string;
      name: string;
      email: string;
    };
    approved: boolean | null;
    comment: string | null;
    decidedAt: Date | null;
  }>;
  canApprove: boolean; // Current user is approver
  allApproved: boolean;
  anyRejected: boolean;
}
