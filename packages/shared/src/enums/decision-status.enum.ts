/**
 * Decision Status Enum
 * Defines the workflow states of a decision requiring approval
 * 
 * DB: decision_status ENUM
 */
export enum DecisionStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  IMPLEMENTED = 'IMPLEMENTED',
}

export const DecisionStatusLabels: Record<DecisionStatus, string> = {
  [DecisionStatus.DRAFT]: 'Draft',
  [DecisionStatus.PENDING_APPROVAL]: 'Pending Approval',
  [DecisionStatus.APPROVED]: 'Approved',
  [DecisionStatus.REJECTED]: 'Rejected',
  [DecisionStatus.IMPLEMENTED]: 'Implemented',
};

export const DecisionStatusColors: Record<DecisionStatus, string> = {
  [DecisionStatus.DRAFT]: 'gray',
  [DecisionStatus.PENDING_APPROVAL]: 'yellow',
  [DecisionStatus.APPROVED]: 'green',
  [DecisionStatus.REJECTED]: 'red',
  [DecisionStatus.IMPLEMENTED]: 'blue',
};
