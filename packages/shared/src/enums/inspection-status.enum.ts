/**
 * Inspection Status Enum
 * Defines the workflow states of an inspection
 * 
 * DB: inspection_status ENUM
 */
export enum InspectionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export const InspectionStatusLabels: Record<InspectionStatus, string> = {
  [InspectionStatus.DRAFT]: 'Draft',
  [InspectionStatus.SUBMITTED]: 'Submitted',
  [InspectionStatus.IN_REVIEW]: 'In Review',
  [InspectionStatus.APPROVED]: 'Approved',
  [InspectionStatus.REJECTED]: 'Rejected',
};

export const InspectionStatusColors: Record<InspectionStatus, string> = {
  [InspectionStatus.DRAFT]: 'gray',
  [InspectionStatus.SUBMITTED]: 'blue',
  [InspectionStatus.IN_REVIEW]: 'yellow',
  [InspectionStatus.APPROVED]: 'green',
  [InspectionStatus.REJECTED]: 'red',
};
