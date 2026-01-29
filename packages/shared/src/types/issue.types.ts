export enum IssueStatus {
  NEW = 'NEW',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  FIXED = 'FIXED',
  VERIFIED = 'VERIFIED',
  CLOSED = 'CLOSED',
  REOPENED = 'REOPENED',
}

export enum IssueSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface Issue {
  id: string;
  projectId: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  
  // Reference to source entity
  refEntityType?: 'TASK' | 'INSPECTION' | 'DELIVERY' | 'DECISION';
  refEntityId?: string;
  
  // Assignment
  assigneeId?: string;
  assignedAt?: Date;
  
  // Workflow timestamps
  startedAt?: Date;
  fixedAt?: Date;
  fixNotes?: string;
  verifiedAt?: Date;
  verifiedBy?: string;
  verifyNotes?: string;
  closedAt?: Date;
  closedBy?: string;
  closeNotes?: string;
  reopenedAt?: Date;
  reopenedBy?: string;
  reopenReason?: string;
  
  // Audit
  createdAt: Date;
  createdBy: string;
  deletedAt?: Date;
}
