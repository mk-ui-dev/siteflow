/**
 * Permission Codes
 * Synchronized with DB seeds (002_seed_system.sql)
 */

export const PERMISSIONS = {
  // Projects
  PROJECT_CREATE: 'project.create',
  PROJECT_UPDATE: 'project.update',
  PROJECT_DELETE: 'project.delete',
  PROJECT_VIEW: 'project.view',
  PROJECT_MEMBERS_MANAGE: 'project.members.manage',

  // Tasks
  TASK_CREATE: 'task.create',
  TASK_UPDATE: 'task.update',
  TASK_DELETE: 'task.delete',
  TASK_VIEW: 'task.view',
  TASK_PLAN: 'task.plan',
  TASK_START: 'task.start',
  TASK_COMPLETE: 'task.complete',
  TASK_ASSIGN: 'task.assign',

  // Inspections
  INSPECTION_CREATE: 'inspection.create',
  INSPECTION_VIEW: 'inspection.view',
  INSPECTION_SUBMIT: 'inspection.submit',
  INSPECTION_APPROVE: 'inspection.approve',
  INSPECTION_REJECT: 'inspection.reject',

  // Issues
  ISSUE_CREATE: 'issue.create',
  ISSUE_VIEW: 'issue.view',
  ISSUE_ASSIGN: 'issue.assign',
  ISSUE_FIX: 'issue.fix',
  ISSUE_VERIFY: 'issue.verify',
  ISSUE_CLOSE: 'issue.close',

  // Deliveries
  DELIVERY_CREATE: 'delivery.create',
  DELIVERY_VIEW: 'delivery.view',
  DELIVERY_UPDATE: 'delivery.update',
  DELIVERY_ACCEPT: 'delivery.accept',
  DELIVERY_REJECT: 'delivery.reject',

  // Decisions
  DECISION_CREATE: 'decision.create',
  DECISION_VIEW: 'decision.view',
  DECISION_APPROVE: 'decision.approve',
  DECISION_REJECT: 'decision.reject',

  // Files
  FILE_UPLOAD: 'file.upload',
  FILE_VIEW: 'file.view',
  FILE_DELETE: 'file.delete',

  // Comments
  COMMENT_CREATE: 'comment.create',
  COMMENT_VIEW: 'comment.view',
  COMMENT_DELETE: 'comment.delete',

  // Activity
  ACTIVITY_VIEW: 'activity.view',
} as const;

export type PermissionCode = typeof PERMISSIONS[keyof typeof PERMISSIONS];
