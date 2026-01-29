/**
 * Notification Enums
 * Defines notification channels and statuses
 * 
 * DB: notification_channel ENUM, notification_status ENUM, outbox_status ENUM
 */

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
}

export const NotificationChannelLabels: Record<NotificationChannel, string> = {
  [NotificationChannel.IN_APP]: 'In-App',
  [NotificationChannel.EMAIL]: 'Email',
};

export enum NotificationStatus {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

export const NotificationStatusLabels: Record<NotificationStatus, string> = {
  [NotificationStatus.QUEUED]: 'Queued',
  [NotificationStatus.SENT]: 'Sent',
  [NotificationStatus.FAILED]: 'Failed',
  [NotificationStatus.CANCELED]: 'Canceled',
};

export enum OutboxStatus {
  NEW = 'NEW',
  PROCESSING = 'PROCESSING',
  DONE = 'DONE',
  FAILED = 'FAILED',
}

export const OutboxStatusLabels: Record<OutboxStatus, string> = {
  [OutboxStatus.NEW]: 'New',
  [OutboxStatus.PROCESSING]: 'Processing',
  [OutboxStatus.DONE]: 'Done',
  [OutboxStatus.FAILED]: 'Failed',
};
