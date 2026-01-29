import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppError, ErrorCode, TaskStatus, InspectionStatus, IssueStatus } from '@siteflow/shared';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private async verifyProject(projectId: string, tenantId: string) {
    const project = await this.prisma.projects.findFirst({
      where: {
        id: projectId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Project not found',
        404,
      );
    }

    return project;
  }

  async getDashboard(projectId: string, tenantId: string) {
    await this.verifyProject(projectId, tenantId);

    const [tasks, inspections, issues, deliveries, decisions] = await Promise.all([
      this.prisma.tasks.count({
        where: { projectId, deletedAt: null },
      }),
      this.prisma.inspections.count({
        where: { projectId, deletedAt: null },
      }),
      this.prisma.issues.count({
        where: { projectId, deletedAt: null },
      }),
      this.prisma.deliveries.count({
        where: { projectId, deletedAt: null },
      }),
      this.prisma.decisions.count({
        where: { projectId, deletedAt: null },
      }),
    ]);

    const [completedTasks, passedInspections, closedIssues] = await Promise.all([
      this.prisma.tasks.count({
        where: { projectId, status: TaskStatus.COMPLETED, deletedAt: null },
      }),
      this.prisma.inspections.count({
        where: { projectId, status: InspectionStatus.PASSED, deletedAt: null },
      }),
      this.prisma.issues.count({
        where: { projectId, status: IssueStatus.CLOSED, deletedAt: null },
      }),
    ]);

    return {
      overview: {
        totalTasks: tasks,
        totalInspections: inspections,
        totalIssues: issues,
        totalDeliveries: deliveries,
        totalDecisions: decisions,
      },
      completion: {
        completedTasks,
        taskCompletionRate: tasks > 0 ? Math.round((completedTasks / tasks) * 100) : 0,
        passedInspections,
        inspectionPassRate: inspections > 0 ? Math.round((passedInspections / inspections) * 100) : 0,
        closedIssues,
        issueResolutionRate: issues > 0 ? Math.round((closedIssues / issues) * 100) : 0,
      },
    };
  }

  async getTasksSummary(projectId: string, tenantId: string) {
    await this.verifyProject(projectId, tenantId);

    const tasks = await this.prisma.tasks.findMany({
      where: { projectId, deletedAt: null },
      select: {
        status: true,
        priority: true,
        dueDate: true,
      },
    });

    const total = tasks.length;
    const byStatus = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = tasks.reduce((acc, task) => {
      const priority = task.priority || 'NONE';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const now = new Date();
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== TaskStatus.COMPLETED).length;

    return {
      total,
      byStatus,
      byPriority,
      overdue,
      overdueRate: total > 0 ? Math.round((overdue / total) * 100) : 0,
    };
  }

  async getInspectionsSummary(projectId: string, tenantId: string) {
    await this.verifyProject(projectId, tenantId);

    const inspections = await this.prisma.inspections.findMany({
      where: { projectId, deletedAt: null },
      select: {
        status: true,
        scheduledDate: true,
      },
    });

    const total = inspections.length;
    const byStatus = inspections.reduce((acc, inspection) => {
      acc[inspection.status] = (acc[inspection.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const now = new Date();
    const overdue = inspections.filter(
      i => i.scheduledDate && new Date(i.scheduledDate) < now && i.status === InspectionStatus.SCHEDULED
    ).length;

    const passed = byStatus[InspectionStatus.PASSED] || 0;
    const rejected = byStatus[InspectionStatus.REJECTED] || 0;
    const completed = passed + rejected;

    return {
      total,
      byStatus,
      overdue,
      passRate: completed > 0 ? Math.round((passed / completed) * 100) : 0,
    };
  }

  async getIssuesSummary(projectId: string, tenantId: string) {
    await this.verifyProject(projectId, tenantId);

    const issues = await this.prisma.issues.findMany({
      where: { projectId, deletedAt: null },
      select: {
        status: true,
        severity: true,
        createdAt: true,
        closedAt: true,
      },
    });

    const total = issues.length;
    const byStatus = issues.reduce((acc, issue) => {
      acc[issue.status] = (acc[issue.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const open = total - (byStatus[IssueStatus.CLOSED] || 0);
    const critical = bySeverity['CRITICAL'] || 0;

    // Average resolution time for closed issues
    const closedIssues = issues.filter(i => i.closedAt);
    const avgResolutionTime = closedIssues.length > 0
      ? Math.round(
          closedIssues.reduce((sum, issue) => {
            const created = new Date(issue.createdAt).getTime();
            const closed = new Date(issue.closedAt!).getTime();
            return sum + (closed - created);
          }, 0) / closedIssues.length / (1000 * 60 * 60 * 24) // Convert to days
        )
      : 0;

    return {
      total,
      open,
      byStatus,
      bySeverity,
      criticalOpen: critical,
      avgResolutionDays: avgResolutionTime,
    };
  }

  async getTimeline(projectId: string, tenantId: string) {
    await this.verifyProject(projectId, tenantId);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [tasksCompleted, inspectionsPassed, issuesClosed] = await Promise.all([
      this.prisma.tasks.findMany({
        where: {
          projectId,
          status: TaskStatus.COMPLETED,
          completedAt: { gte: thirtyDaysAgo },
          deletedAt: null,
        },
        select: { completedAt: true },
      }),
      this.prisma.inspections.findMany({
        where: {
          projectId,
          status: InspectionStatus.PASSED,
          completedAt: { gte: thirtyDaysAgo },
          deletedAt: null,
        },
        select: { completedAt: true },
      }),
      this.prisma.issues.findMany({
        where: {
          projectId,
          status: IssueStatus.CLOSED,
          closedAt: { gte: thirtyDaysAgo },
          deletedAt: null,
        },
        select: { closedAt: true },
      }),
    ]);

    // Group by day
    const timelineData: Record<string, any> = {};
    
    tasksCompleted.forEach(task => {
      if (task.completedAt) {
        const date = new Date(task.completedAt).toISOString().split('T')[0];
        timelineData[date] = timelineData[date] || { tasksCompleted: 0, inspectionsPassed: 0, issuesClosed: 0 };
        timelineData[date].tasksCompleted++;
      }
    });

    inspectionsPassed.forEach(inspection => {
      if (inspection.completedAt) {
        const date = new Date(inspection.completedAt).toISOString().split('T')[0];
        timelineData[date] = timelineData[date] || { tasksCompleted: 0, inspectionsPassed: 0, issuesClosed: 0 };
        timelineData[date].inspectionsPassed++;
      }
    });

    issuesClosed.forEach(issue => {
      if (issue.closedAt) {
        const date = new Date(issue.closedAt).toISOString().split('T')[0];
        timelineData[date] = timelineData[date] || { tasksCompleted: 0, inspectionsPassed: 0, issuesClosed: 0 };
        timelineData[date].issuesClosed++;
      }
    });

    return {
      period: 'last30Days',
      data: Object.entries(timelineData)
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  async getTasksByStatus(projectId: string, tenantId: string) {
    await this.verifyProject(projectId, tenantId);

    const tasks = await this.prisma.tasks.findMany({
      where: { projectId, deletedAt: null },
      include: {
        assignees: {
          select: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    const grouped = tasks.reduce((acc, task) => {
      if (!acc[task.status]) {
        acc[task.status] = [];
      }
      acc[task.status].push(task);
      return acc;
    }, {} as Record<string, any[]>);

    return grouped;
  }

  async getTasksByAssignee(projectId: string, tenantId: string) {
    await this.verifyProject(projectId, tenantId);

    const assignments = await this.prisma.taskAssignees.findMany({
      where: {
        task: { projectId, deletedAt: null },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
          },
        },
      },
    });

    const grouped = assignments.reduce((acc, assignment) => {
      const userId = assignment.user.id;
      if (!acc[userId]) {
        acc[userId] = {
          user: assignment.user,
          tasks: [],
          totalTasks: 0,
          completedTasks: 0,
        };
      }
      acc[userId].tasks.push(assignment.task);
      acc[userId].totalTasks++;
      if (assignment.task.status === TaskStatus.COMPLETED) {
        acc[userId].completedTasks++;
      }
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped);
  }

  async getOverdueItems(projectId: string, tenantId: string) {
    await this.verifyProject(projectId, tenantId);

    const now = new Date();

    const [overdueTasks, overdueInspections] = await Promise.all([
      this.prisma.tasks.findMany({
        where: {
          projectId,
          dueDate: { lt: now },
          status: { not: TaskStatus.COMPLETED },
          deletedAt: null,
        },
        include: {
          assignees: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.inspections.findMany({
        where: {
          projectId,
          scheduledDate: { lt: now },
          status: InspectionStatus.SCHEDULED,
          deletedAt: null,
        },
        include: {
          inspector: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { scheduledDate: 'asc' },
      }),
    ]);

    return {
      tasks: overdueTasks,
      inspections: overdueInspections,
      totalOverdue: overdueTasks.length + overdueInspections.length,
    };
  }

  async getCriticalIssues(projectId: string, tenantId: string) {
    await this.verifyProject(projectId, tenantId);

    const issues = await this.prisma.issues.findMany({
      where: {
        projectId,
        severity: { in: ['HIGH', 'CRITICAL'] },
        status: { notIn: [IssueStatus.CLOSED] },
        deletedAt: null,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        createdByUser: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    return {
      issues,
      count: issues.length,
    };
  }

  async getProjectHealth(projectId: string, tenantId: string) {
    await this.verifyProject(projectId, tenantId);

    const [dashboard, tasksSummary, issuesSummary, overdueItems] = await Promise.all([
      this.getDashboard(projectId, tenantId),
      this.getTasksSummary(projectId, tenantId),
      this.getIssuesSummary(projectId, tenantId),
      this.getOverdueItems(projectId, tenantId),
    ]);

    // Calculate health score (0-100)
    let healthScore = 100;

    // Deduct for low completion rates
    const taskCompletionRate = dashboard.completion.taskCompletionRate;
    if (taskCompletionRate < 50) healthScore -= 20;
    else if (taskCompletionRate < 75) healthScore -= 10;

    // Deduct for overdue items
    const overdueRate = tasksSummary.overdueRate;
    if (overdueRate > 20) healthScore -= 20;
    else if (overdueRate > 10) healthScore -= 10;

    // Deduct for open critical issues
    const criticalIssues = issuesSummary.criticalOpen;
    if (criticalIssues > 5) healthScore -= 20;
    else if (criticalIssues > 2) healthScore -= 10;

    // Deduct for low inspection pass rate
    const inspectionPassRate = dashboard.completion.inspectionPassRate;
    if (inspectionPassRate < 70) healthScore -= 15;
    else if (inspectionPassRate < 85) healthScore -= 5;

    healthScore = Math.max(0, healthScore);

    let status: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
    if (healthScore >= 85) status = 'EXCELLENT';
    else if (healthScore >= 70) status = 'GOOD';
    else if (healthScore >= 50) status = 'WARNING';
    else status = 'CRITICAL';

    return {
      healthScore,
      status,
      metrics: {
        taskCompletionRate,
        overdueRate,
        criticalIssuesOpen: criticalIssues,
        inspectionPassRate,
        totalOverdue: overdueItems.totalOverdue,
      },
      recommendations: this.getRecommendations(healthScore, {
        overdueRate,
        criticalIssues,
        taskCompletionRate,
        inspectionPassRate,
      }),
    };
  }

  private getRecommendations(
    healthScore: number,
    metrics: {
      overdueRate: number;
      criticalIssues: number;
      taskCompletionRate: number;
      inspectionPassRate: number;
    },
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.overdueRate > 10) {
      recommendations.push('Address overdue tasks to improve project timeline');
    }

    if (metrics.criticalIssues > 2) {
      recommendations.push('Prioritize resolving critical issues');
    }

    if (metrics.taskCompletionRate < 75) {
      recommendations.push('Increase task completion rate to stay on schedule');
    }

    if (metrics.inspectionPassRate < 85) {
      recommendations.push('Improve quality to increase inspection pass rate');
    }

    if (recommendations.length === 0) {
      recommendations.push('Project is performing well, maintain current pace');
    }

    return recommendations;
  }
}
