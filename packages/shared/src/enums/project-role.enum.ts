/**
 * Project Role Enum
 * Defines user roles within a project
 * 
 * DB: project_role ENUM
 */
export enum ProjectRole {
  INVESTOR = 'INVESTOR',
  INSPECTOR = 'INSPECTOR',
  GC = 'GC',
  SUB = 'SUB',
  PROCUREMENT = 'PROCUREMENT',
}

export const ProjectRoleLabels: Record<ProjectRole, string> = {
  [ProjectRole.INVESTOR]: 'Investor',
  [ProjectRole.INSPECTOR]: 'Inspector',
  [ProjectRole.GC]: 'General Contractor',
  [ProjectRole.SUB]: 'Subcontractor',
  [ProjectRole.PROCUREMENT]: 'Procurement',
};
