/**
 * Inspection Types
 * Formal inspections with checklists
 */

import type { InspectionStatus, ChecklistItemType } from '../enums';
import type { BaseEntity, UserTracked } from './common.types';

/**
 * Checklist Template
 * DB: checklist_templates table
 */
export interface ChecklistTemplate extends BaseEntity, UserTracked {
  tenantId: string;
  name: string;
  discipline: string;
  version: number;
  isActive: boolean;
}

/**
 * Checklist Template Item
 * DB: checklist_template_items table
 */
export interface ChecklistTemplateItem extends BaseEntity {
  templateId: string;
  label: string;
  itemType: ChecklistItemType;
  isRequired: boolean;
  position: number;
  selectOptions: string[] | null;
  requiresPhoto: boolean; // INV-4: Photo requirement
}

/**
 * Checklist Run
 * DB: checklist_runs table
 */
export interface ChecklistRun extends BaseEntity, UserTracked {
  projectId: string;
  templateId: string;
  completionRequired: number;
  completionDone: number;
}

/**
 * Checklist Run Answer
 * DB: checklist_run_answers table
 */
export interface ChecklistRunAnswer extends BaseEntity {
  runId: string;
  templateItemId: string;
  valueBool: boolean | null;
  valueText: string | null;
  valueNumber: number | null;
  valueSelect: string | null;
  isFilled: boolean;
  answeredAt: Date | null;
  answeredBy: string | null;
}

/**
 * Inspection
 * DB: inspections table
 */
export interface Inspection extends BaseEntity, UserTracked {
  projectId: string;
  taskId: string | null;
  locationId: string | null;
  checklistRunId: string;
  status: InspectionStatus;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  decisionAt: Date | null;
  decisionReason: string | null;
}

/**
 * Inspection Status History
 * DB: inspection_status_history table
 */
export interface InspectionStatusHistory extends BaseEntity {
  inspectionId: string;
  fromStatus: InspectionStatus | null;
  toStatus: InspectionStatus;
  changedAt: Date;
  changedBy: string | null;
}

/**
 * Inspection with checklist (enriched)
 */
export interface InspectionWithChecklist extends Inspection {
  checklist: {
    templateName: string;
    discipline: string;
    items: Array<{
      templateItem: ChecklistTemplateItem;
      answer: ChecklistRunAnswer;
      hasRequiredPhoto: boolean; // Validated via attachment_links.meta
    }>;
    completionPercent: number;
  };
}
