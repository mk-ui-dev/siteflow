/**
 * Issue Status Enum
 * Defines the lifecycle states of a punch-list issue
 * 
 * DB: issue_status ENUM
 */
export enum IssueStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  FIXED = 'FIXED',
  VERIFIED = 'VERIFIED',
  CLOSED = 'CLOSED',
}

export const IssueStatusLabels: Record<IssueStatus, string> = {
  [IssueStatus.OPEN]: 'Open',
  [IssueStatus.ASSIGNED]: 'Assigned',
  [IssueStatus.FIXED]: 'Fixed',
  [IssueStatus.VERIFIED]: 'Verified',
  [IssueStatus.CLOSED]: 'Closed',
};

export const IssueStatusColors: Record<IssueStatus, string> = {
  [IssueStatus.OPEN]: 'red',
  [IssueStatus.ASSIGNED]: 'yellow',
  [IssueStatus.FIXED]: 'blue',
  [IssueStatus.VERIFIED]: 'purple',
  [IssueStatus.CLOSED]: 'green',
};
