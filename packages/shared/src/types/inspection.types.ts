export enum InspectionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ChecklistItemType {
  BOOL = 'BOOL',
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  SELECT = 'SELECT',
  PHOTO = 'PHOTO',
}

export interface ChecklistTemplate {
  id: string;
  tenantId: string;
  name: string;
  discipline: string;
  version: number;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

export interface ChecklistTemplateItem {
  id: string;
  templateId: string;
  questionText: string;
  itemType: ChecklistItemType;
  isRequired: boolean;
  requiresPhoto: boolean;
  optionsJson?: any;
  order: number;
}

export interface Inspection {
  id: string;
  taskId: string;
  checklistTemplateId: string;
  inspectorId?: string;
  status: InspectionStatus;
  submittedAt?: Date;
  submittedBy?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: Date;
  createdBy: string;
  deletedAt?: Date;
}
