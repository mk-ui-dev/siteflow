/**
 * Entity Type Enum
 * Defines entity types for polymorphic relationships
 * Used in: activity_log, attachment_links, comments
 * 
 * DB: entity_type ENUM
 */
export enum EntityType {
  TASK = 'TASK',
  INSPECTION = 'INSPECTION',
  ISSUE = 'ISSUE',
  DELIVERY = 'DELIVERY',
  DECISION = 'DECISION',
  LOCATION = 'LOCATION',
  COMMENT = 'COMMENT',
  FILE = 'FILE',
  PROJECT = 'PROJECT',
}

export const EntityTypeLabels: Record<EntityType, string> = {
  [EntityType.TASK]: 'Task',
  [EntityType.INSPECTION]: 'Inspection',
  [EntityType.ISSUE]: 'Issue',
  [EntityType.DELIVERY]: 'Delivery',
  [EntityType.DECISION]: 'Decision',
  [EntityType.LOCATION]: 'Location',
  [EntityType.COMMENT]: 'Comment',
  [EntityType.FILE]: 'File',
  [EntityType.PROJECT]: 'Project',
};
