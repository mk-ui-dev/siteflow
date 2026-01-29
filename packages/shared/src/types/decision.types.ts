export enum DecisionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface Decision {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: DecisionStatus;
  
  // Approval
  requiredApprovers: number;
  decidedAt?: Date;
  
  // Audit
  createdAt: Date;
  createdBy: string;
  deletedAt?: Date;
  
  // Relations
  options: DecisionOption[];
}

export interface DecisionOption {
  id: string;
  decisionId: string;
  optionText: string;
  order: number;
}

export interface DecisionApproval {
  id: string;
  decisionId: string;
  approverId: string;
  isApproved: boolean;
  selectedOptionId?: string;
  notes: string;
  approvedAt: Date;
}
