export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_OVERDUE = 'TASK_OVERDUE',
  INSPECTION_SCHEDULED = 'INSPECTION_SCHEDULED',
  INSPECTION_COMPLETED = 'INSPECTION_COMPLETED',
  INSPECTION_REJECTED = 'INSPECTION_REJECTED',
  ISSUE_ASSIGNED = 'ISSUE_ASSIGNED',
  ISSUE_CREATED = 'ISSUE_CREATED',
  ISSUE_CLOSED = 'ISSUE_CLOSED',
  DELIVERY_CONFIRMED = 'DELIVERY_CONFIRMED',
  DECISION_APPROVED = 'DECISION_APPROVED',
  DECISION_REJECTED = 'DECISION_REJECTED',
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  
  // Entity reference
  entityType?: string;
  entityId?: string;
  
  // Status
  readAt?: Date;
  createdAt: Date;
}

export enum WebhookEventType {
  TASK_CREATED = 'TASK_CREATED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_OVERDUE = 'TASK_OVERDUE',
  INSPECTION_SCHEDULED = 'INSPECTION_SCHEDULED',
  INSPECTION_COMPLETED = 'INSPECTION_COMPLETED',
  ISSUE_CREATED = 'ISSUE_CREATED',
  ISSUE_ASSIGNED = 'ISSUE_ASSIGNED',
  ISSUE_CLOSED = 'ISSUE_CLOSED',
  DELIVERY_CONFIRMED = 'DELIVERY_CONFIRMED',
  DECISION_APPROVED = 'DECISION_APPROVED',
}

export interface Webhook {
  id: string;
  projectId: string;
  url: string;
  eventTypes: string[];
  secret?: string;
  isActive: boolean;
  lastTriggeredAt?: Date;
  createdBy: string;
  createdAt: Date;
  deletedAt?: Date;
}
