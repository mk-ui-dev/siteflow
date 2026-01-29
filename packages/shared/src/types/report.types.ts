export enum HealthStatus {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export interface ProjectHealth {
  healthScore: number; // 0-100
  status: HealthStatus;
  metrics: {
    taskCompletionRate: number;
    overdueRate: number;
    criticalIssuesOpen: number;
    inspectionPassRate: number;
    totalOverdue: number;
  };
  recommendations: string[];
}

export interface DashboardStats {
  overview: {
    totalTasks: number;
    totalInspections: number;
    totalIssues: number;
    totalDeliveries: number;
    totalDecisions: number;
  };
  completion: {
    completedTasks: number;
    taskCompletionRate: number;
    passedInspections: number;
    inspectionPassRate: number;
    closedIssues: number;
    issueResolutionRate: number;
  };
}

export interface TasksSummary {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  overdue: number;
  overdueRate: number;
}

export interface TimelineData {
  period: string;
  data: Array<{
    date: string;
    tasksCompleted: number;
    inspectionsPassed: number;
    issuesClosed: number;
  }>;
}
