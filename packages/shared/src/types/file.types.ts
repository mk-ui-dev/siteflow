export enum EntityType {
  TASK = 'TASK',
  INSPECTION = 'INSPECTION',
  ISSUE = 'ISSUE',
  DELIVERY = 'DELIVERY',
  DECISION = 'DECISION',
}

export interface File {
  id: string;
  projectId: string;
  
  // File info
  fileName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  
  // Entity attachment
  entityType?: EntityType;
  entityId?: string;
  
  // Audit
  uploadedBy: string;
  uploadedAt: Date;
  deletedAt?: Date;
}
