/**
 * Notification Types
 * In-app and email notification system
 */

import type {
  NotificationChannel,
  NotificationStatus,
  OutboxStatus,
  EntityType,
} from '../enums';
import type { BaseEntity } from './common.types';

/**
 * Outbox Event
 * DB: outbox_events table
 */
export interface OutboxEvent extends BaseEntity {
  eventType: string;
  payload: Record<string, any>;
  status: OutboxStatus;
  availableAt: Date;
  attempts: number;
  lastError: string | null;
  processedAt: Date | null;
}

/**
 * Notification
 * DB: notifications table
 */
export interface Notification extends BaseEntity {
  userId: string;
  projectId: string | null;
  channel: NotificationChannel;
  status: NotificationStatus;
  title: string;
  body: string;
  linkEntityType: EntityType | null;
  linkEntityId: string | null;
  readAt: Date | null;
  sentAt: Date | null;
  failedAt: Date | null;
  error: string | null;
}

/**
 * User Notification Settings
 * DB: user_notification_settings table
 */
export interface UserNotificationSettings {
  userId: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  digestEnabled: boolean;
  digestTime: string; // HH:MM format
  timezone: string;
  updatedAt: Date;
}

/**
 * Email Delivery Log
 * DB: email_delivery_log table
 */
export interface EmailDeliveryLog extends BaseEntity {
  notificationId: string | null;
  recipientEmail: string;
  subject: string;
  sentAt: Date | null;
  failedAt: Date | null;
  error: string | null;
}

/**
 * Activity Log
 * DB: activity_log table
 */
export interface ActivityLog extends BaseEntity, UserTracked {
  projectId: string | null;
  entityType: EntityType;
  entityId: string;
  action: string;
  diff: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  } | null;
}

/**
 * Automation Rule
 * DB: automation_rules table
 */
export interface AutomationRule extends BaseEntity {
  scope: 'INSTANCE' | 'TENANT' | 'PROJECT';
  scopeId: string | null;
  config: {
    reminder?: {
      enabled: boolean;
      dMinus: number[];
      entityTypes: EntityType[];
    };
    escalation?: {
      enabled: boolean;
      issueOverdueNotifyRoles: string[];
      inspectionReviewHours: number;
    };
    digest?: {
      enabled: boolean;
      include: string[];
    };
  };
  isActive: boolean;
  updatedAt: Date;
}

/**
 * Job Run
 * DB: job_runs table
 */
export interface JobRun extends BaseEntity {
  jobName: string;
  startedAt: Date;
  finishedAt: Date | null;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  recordsProcessed: number | null;
  error: string | null;
}
