export const PERMISSIONS = {
  // Users
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',

  // Projects
  PROJECT_VIEW: 'project:view',
  PROJECT_CREATE: 'project:create',
  PROJECT_EDIT: 'project:edit',
  PROJECT_DELETE: 'project:delete',

  // Tasks
  TASK_VIEW: 'task:view',
  TASK_CREATE: 'task:create',
  TASK_EDIT: 'task:edit',
  TASK_DELETE: 'task:delete',
  TASK_PLAN: 'task:plan',
  TASK_START: 'task:start',
  TASK_COMPLETE: 'task:complete',
  TASK_ASSIGN: 'task:assign',

  // Inspections
  INSPECTION_VIEW: 'inspection:view',
  INSPECTION_CREATE: 'inspection:create',
  INSPECTION_EDIT: 'inspection:edit',
  INSPECTION_SUBMIT: 'inspection:submit',
  INSPECTION_REVIEW: 'inspection:review', // INSPECTOR role only

  // Checklist Templates
  CHECKLIST_VIEW: 'checklist:view',
  CHECKLIST_CREATE: 'checklist:create',
  CHECKLIST_EDIT: 'checklist:edit',

  // Issues
  ISSUE_VIEW: 'issue:view',
  ISSUE_CREATE: 'issue:create',
  ISSUE_EDIT: 'issue:edit',

  // Deliveries
  DELIVERY_VIEW: 'delivery:view',
  DELIVERY_CREATE: 'delivery:create',
  DELIVERY_EDIT: 'delivery:edit',

  // Decisions
  DECISION_VIEW: 'decision:view',
  DECISION_CREATE: 'decision:create',
  DECISION_EDIT: 'decision:edit',
  DECISION_APPROVE: 'decision:approve',

  // Files
  FILE_VIEW: 'file:view',
  FILE_UPLOAD: 'file:upload',
  FILE_DELETE: 'file:delete',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
