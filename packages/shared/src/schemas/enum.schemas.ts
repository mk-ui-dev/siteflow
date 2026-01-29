/**
 * Enum Validation Schemas
 */

import { z } from 'zod';
import {
  ProjectRole,
  TaskStatus,
  InspectionStatus,
  IssueStatus,
  DeliveryStatus,
  DecisionStatus,
  EntityType,
  ChecklistItemType,
  NotificationChannel,
  NotificationStatus,
} from '../enums';

export const ProjectRoleSchema = z.nativeEnum(ProjectRole);
export const TaskStatusSchema = z.nativeEnum(TaskStatus);
export const InspectionStatusSchema = z.nativeEnum(InspectionStatus);
export const IssueStatusSchema = z.nativeEnum(IssueStatus);
export const DeliveryStatusSchema = z.nativeEnum(DeliveryStatus);
export const DecisionStatusSchema = z.nativeEnum(DecisionStatus);
export const EntityTypeSchema = z.nativeEnum(EntityType);
export const ChecklistItemTypeSchema = z.nativeEnum(ChecklistItemType);
export const NotificationChannelSchema = z.nativeEnum(NotificationChannel);
export const NotificationStatusSchema = z.nativeEnum(NotificationStatus);
