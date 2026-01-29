import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppError, ErrorCode, IssueStatus, IssueSeverity } from '@siteflow/shared';

@Injectable()
export class IssuesService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    filters?: {
      projectId?: string;
      status?: IssueStatus;
      severity?: IssueSeverity;
      assigneeId?: string;
      refEntityType?: string;
      refEntityId?: string;
    },
  ) {
    const where: any = {
      project: { tenantId, deletedAt: null },
      deletedAt: null,
    };

    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.status) where.status = filters.status;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters?.refEntityType) where.refEntityType = filters.refEntityType;
    if (filters?.refEntityId) where.refEntityId = filters.refEntityId;

    return this.prisma.issues.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findOne(id: string, tenantId: string) {
    const issue = await this.prisma.issues.findFirst({
      where: {
        id,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        statusHistory: {
          include: {
            changedByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            changedAt: 'desc',
          },
        },
      },
    });

    if (!issue) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Issue not found',
        404,
      );
    }

    return issue;
  }

  async create(
    data: {
      projectId: string;
      title: string;
      description: string;
      severity: IssueSeverity;
      refEntityType?: 'TASK' | 'INSPECTION' | 'DELIVERY' | 'DECISION';
      refEntityId?: string;
    },
    userId: string,
    tenantId: string,
  ) {
    // Verify project
    const project = await this.prisma.projects.findFirst({
      where: {
        id: data.projectId,
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

    // Create issue
    return this.prisma.issues.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        severity: data.severity,
        status: IssueStatus.NEW,
        refEntityType: data.refEntityType as any,
        refEntityId: data.refEntityId,
        createdBy: userId,
      },
      include: {
        project: true,
      },
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      severity?: IssueSeverity;
    },
    tenantId: string,
  ) {
    // Verify issue
    const issue = await this.prisma.issues.findFirst({
      where: {
        id,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
    });

    if (!issue) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Issue not found',
        404,
      );
    }

    return this.prisma.issues.update({
      where: { id },
      data,
      include: {
        assignee: true,
      },
    });
  }

  async assign(
    id: string,
    assigneeId: string,
    userId: string,
    tenantId: string,
  ) {
    // Verify issue
    const issue = await this.prisma.issues.findFirst({
      where: {
        id,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
    });

    if (!issue) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Issue not found',
        404,
      );
    }

    // Verify assignee is project member
    const projectMember = await this.prisma.projectMembers.findFirst({
      where: {
        projectId: issue.projectId,
        userId: assigneeId,
      },
    });

    if (!projectMember) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Assignee must be a project member',
        400,
      );
    }

    // Update issue
    const [updated] = await this.prisma.$transaction([
      this.prisma.issues.update({
        where: { id },
        data: {
          assigneeId,
          status: IssueStatus.ASSIGNED,
          assignedAt: new Date(),
        },
      }),
      this.prisma.issueStatusHistory.create({
        data: {
          issueId: id,
          fromStatus: issue.status,
          toStatus: IssueStatus.ASSIGNED,
          changedBy: userId,
        },
      }),
    ]);

    return updated;
  }

  async start(id: string, userId: string, tenantId: string) {
    // Verify issue
    const issue = await this.prisma.issues.findFirst({
      where: {
        id,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
    });

    if (!issue) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Issue not found',
        404,
      );
    }

    if (issue.status !== IssueStatus.ASSIGNED) {
      throw new AppError(
        ErrorCode.ISSUE_INVALID_STATE,
        'Can only start ASSIGNED issues',
        400,
      );
    }

    if (issue.assigneeId !== userId) {
      throw new AppError(
        ErrorCode.PERMISSION_DENIED,
        'Only assignee can start issue',
        403,
      );
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.issues.update({
        where: { id },
        data: {
          status: IssueStatus.IN_PROGRESS,
          startedAt: new Date(),
        },
      }),
      this.prisma.issueStatusHistory.create({
        data: {
          issueId: id,
          fromStatus: IssueStatus.ASSIGNED,
          toStatus: IssueStatus.IN_PROGRESS,
          changedBy: userId,
        },
      }),
    ]);

    return updated;
  }

  async fix(id: string, notes: string, userId: string, tenantId: string) {
    // Verify issue
    const issue = await this.prisma.issues.findFirst({
      where: {
        id,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
    });

    if (!issue) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Issue not found',
        404,
      );
    }

    if (issue.status !== IssueStatus.IN_PROGRESS) {
      throw new AppError(
        ErrorCode.ISSUE_INVALID_STATE,
        'Can only fix IN_PROGRESS issues',
        400,
      );
    }

    if (issue.assigneeId !== userId) {
      throw new AppError(
        ErrorCode.PERMISSION_DENIED,
        'Only assignee can mark as fixed',
        403,
      );
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.issues.update({
        where: { id },
        data: {
          status: IssueStatus.FIXED,
          fixedAt: new Date(),
          fixNotes: notes,
        },
      }),
      this.prisma.issueStatusHistory.create({
        data: {
          issueId: id,
          fromStatus: IssueStatus.IN_PROGRESS,
          toStatus: IssueStatus.FIXED,
          changedBy: userId,
          reason: notes,
        },
      }),
    ]);

    return updated;
  }

  async verify(id: string, notes: string, userId: string, tenantId: string) {
    // Verify issue
    const issue = await this.prisma.issues.findFirst({
      where: {
        id,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
    });

    if (!issue) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Issue not found',
        404,
      );
    }

    if (issue.status !== IssueStatus.FIXED) {
      throw new AppError(
        ErrorCode.ISSUE_INVALID_STATE,
        'Can only verify FIXED issues',
        400,
      );
    }

    // Only creator or inspector can verify
    const user = await this.prisma.users.findFirst({
      where: { id: userId },
    });

    if (issue.createdBy !== userId && user?.role !== 'INSPECTOR' && user?.role !== 'ADMIN') {
      throw new AppError(
        ErrorCode.PERMISSION_DENIED,
        'Only issue creator or inspector can verify',
        403,
      );
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.issues.update({
        where: { id },
        data: {
          status: IssueStatus.VERIFIED,
          verifiedAt: new Date(),
          verifiedBy: userId,
          verifyNotes: notes,
        },
      }),
      this.prisma.issueStatusHistory.create({
        data: {
          issueId: id,
          fromStatus: IssueStatus.FIXED,
          toStatus: IssueStatus.VERIFIED,
          changedBy: userId,
          reason: notes,
        },
      }),
    ]);

    return updated;
  }

  async close(id: string, notes: string, userId: string, tenantId: string) {
    // Verify issue
    const issue = await this.prisma.issues.findFirst({
      where: {
        id,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
    });

    if (!issue) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Issue not found',
        404,
      );
    }

    if (issue.status !== IssueStatus.VERIFIED) {
      throw new AppError(
        ErrorCode.ISSUE_INVALID_STATE,
        'Can only close VERIFIED issues',
        400,
      );
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.issues.update({
        where: { id },
        data: {
          status: IssueStatus.CLOSED,
          closedAt: new Date(),
          closedBy: userId,
          closeNotes: notes,
        },
      }),
      this.prisma.issueStatusHistory.create({
        data: {
          issueId: id,
          fromStatus: IssueStatus.VERIFIED,
          toStatus: IssueStatus.CLOSED,
          changedBy: userId,
          reason: notes,
        },
      }),
    ]);

    return updated;
  }

  async reopen(id: string, reason: string, userId: string, tenantId: string) {
    // Verify issue
    const issue = await this.prisma.issues.findFirst({
      where: {
        id,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
    });

    if (!issue) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Issue not found',
        404,
      );
    }

    if (issue.status !== IssueStatus.CLOSED) {
      throw new AppError(
        ErrorCode.ISSUE_INVALID_STATE,
        'Can only reopen CLOSED issues',
        400,
      );
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.issues.update({
        where: { id },
        data: {
          status: IssueStatus.REOPENED,
          reopenedAt: new Date(),
          reopenedBy: userId,
          reopenReason: reason,
        },
      }),
      this.prisma.issueStatusHistory.create({
        data: {
          issueId: id,
          fromStatus: IssueStatus.CLOSED,
          toStatus: IssueStatus.REOPENED,
          changedBy: userId,
          reason,
        },
      }),
    ]);

    return updated;
  }

  async getStatusHistory(id: string, tenantId: string) {
    // Verify issue
    const issue = await this.prisma.issues.findFirst({
      where: {
        id,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
    });

    if (!issue) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Issue not found',
        404,
      );
    }

    return this.prisma.issueStatusHistory.findMany({
      where: { issueId: id },
      include: {
        changedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        changedAt: 'desc',
      },
    });
  }
}
