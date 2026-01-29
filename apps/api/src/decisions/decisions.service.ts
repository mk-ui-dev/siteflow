import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppError, ErrorCode, DecisionStatus } from '@siteflow/shared';

@Injectable()
export class DecisionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    filters?: {
      projectId?: string;
      status?: DecisionStatus;
    },
  ) {
    const where: any = {
      project: { tenantId, deletedAt: null },
      deletedAt: null,
    };

    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.status) where.status = filters.status;

    return this.prisma.decisions.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        options: true,
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const decision = await this.prisma.decisions.findFirst({
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
        options: {
          orderBy: {
            order: 'asc',
          },
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            approvedAt: 'desc',
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

    if (!decision) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Decision not found',
        404,
      );
    }

    return decision;
  }

  async create(
    data: {
      projectId: string;
      title: string;
      description: string;
      requiredApprovers: number;
      options?: Array<{
        optionText: string;
        order: number;
      }>;
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

    // Create decision
    const decision = await this.prisma.decisions.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        requiredApprovers: data.requiredApprovers,
        status: DecisionStatus.PENDING,
        createdBy: userId,
        options: data.options
          ? {
              create: data.options,
            }
          : undefined,
      },
      include: {
        options: true,
      },
    });

    return decision;
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      requiredApprovers?: number;
    },
    tenantId: string,
  ) {
    // Verify decision
    const decision = await this.prisma.decisions.findFirst({
      where: {
        id,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
    });

    if (!decision) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Decision not found',
        404,
      );
    }

    if (decision.status !== DecisionStatus.PENDING) {
      throw new AppError(
        ErrorCode.DECISION_INVALID_STATE,
        'Can only update PENDING decisions',
        400,
      );
    }

    return this.prisma.decisions.update({
      where: { id },
      data,
      include: {
        options: true,
      },
    });
  }

  async addOption(
    decisionId: string,
    data: {
      optionText: string;
      order: number;
    },
    tenantId: string,
  ) {
    // Verify decision
    const decision = await this.prisma.decisions.findFirst({
      where: {
        id: decisionId,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
    });

    if (!decision) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Decision not found',
        404,
      );
    }

    if (decision.status !== DecisionStatus.PENDING) {
      throw new AppError(
        ErrorCode.DECISION_INVALID_STATE,
        'Can only add options to PENDING decisions',
        400,
      );
    }

    return this.prisma.decisionOptions.create({
      data: {
        decisionId,
        ...data,
      },
    });
  }

  async updateOption(
    decisionId: string,
    optionId: string,
    data: {
      optionText?: string;
      order?: number;
    },
    tenantId: string,
  ) {
    // Verify decision and option
    const decision = await this.prisma.decisions.findFirst({
      where: {
        id: decisionId,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
      include: {
        options: {
          where: { id: optionId },
        },
      },
    });

    if (!decision || decision.options.length === 0) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Decision or option not found',
        404,
      );
    }

    return this.prisma.decisionOptions.update({
      where: { id: optionId },
      data,
    });
  }

  async deleteOption(
    decisionId: string,
    optionId: string,
    tenantId: string,
  ) {
    // Verify decision and option
    const decision = await this.prisma.decisions.findFirst({
      where: {
        id: decisionId,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
      include: {
        options: {
          where: { id: optionId },
        },
      },
    });

    if (!decision || decision.options.length === 0) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Decision or option not found',
        404,
      );
    }

    await this.prisma.decisionOptions.delete({
      where: { id: optionId },
    });

    return { message: 'Option deleted' };
  }

  async approve(
    id: string,
    data: {
      selectedOptionId?: string;
      notes: string;
    },
    userId: string,
    tenantId: string,
  ) {
    // Verify decision
    const decision = await this.prisma.decisions.findFirst({
      where: {
        id,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
      include: {
        approvals: true,
        options: true,
      },
    });

    if (!decision) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Decision not found',
        404,
      );
    }

    if (decision.status !== DecisionStatus.PENDING) {
      throw new AppError(
        ErrorCode.DECISION_INVALID_STATE,
        'Can only approve PENDING decisions',
        400,
      );
    }

    // Check if user already approved
    const existing = decision.approvals.find(
      (a) => a.approverId === userId && a.isApproved,
    );

    if (existing) {
      throw new AppError(
        ErrorCode.DECISION_ALREADY_APPROVED,
        'User has already approved this decision',
        400,
      );
    }

    // Verify selected option if provided
    if (data.selectedOptionId) {
      const option = decision.options.find(
        (o) => o.id === data.selectedOptionId,
      );
      if (!option) {
        throw new AppError(
          ErrorCode.RESOURCE_NOT_FOUND,
          'Selected option not found',
          404,
        );
      }
    }

    // Create approval
    await this.prisma.decisionApprovals.create({
      data: {
        decisionId: id,
        approverId: userId,
        isApproved: true,
        selectedOptionId: data.selectedOptionId,
        notes: data.notes,
      },
    });

    // Check if decision should be approved
    const approvalCount = decision.approvals.filter((a) => a.isApproved).length + 1;

    if (approvalCount >= decision.requiredApprovers) {
      // Approve decision
      const [updated] = await this.prisma.$transaction([
        this.prisma.decisions.update({
          where: { id },
          data: {
            status: DecisionStatus.APPROVED,
            decidedAt: new Date(),
          },
        }),
        this.prisma.decisionStatusHistory.create({
          data: {
            decisionId: id,
            fromStatus: DecisionStatus.PENDING,
            toStatus: DecisionStatus.APPROVED,
            changedBy: userId,
          },
        }),
      ]);

      // Remove DECISION blocks
      await this.prisma.taskBlocks.updateMany({
        where: {
          refEntityType: 'DECISION',
          refEntityId: id,
          isActive: true,
        },
        data: {
          isActive: false,
          resolvedAt: new Date(),
          resolvedBy: userId,
        },
      });

      return updated;
    }

    return this.findOne(id, tenantId);
  }

  async reject(
    id: string,
    notes: string,
    userId: string,
    tenantId: string,
  ) {
    // Verify decision
    const decision = await this.prisma.decisions.findFirst({
      where: {
        id,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
    });

    if (!decision) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Decision not found',
        404,
      );
    }

    if (decision.status !== DecisionStatus.PENDING) {
      throw new AppError(
        ErrorCode.DECISION_INVALID_STATE,
        'Can only reject PENDING decisions',
        400,
      );
    }

    // Create rejection
    await this.prisma.decisionApprovals.create({
      data: {
        decisionId: id,
        approverId: userId,
        isApproved: false,
        notes,
      },
    });

    // Reject decision
    const [updated] = await this.prisma.$transaction([
      this.prisma.decisions.update({
        where: { id },
        data: {
          status: DecisionStatus.REJECTED,
          decidedAt: new Date(),
        },
      }),
      this.prisma.decisionStatusHistory.create({
        data: {
          decisionId: id,
          fromStatus: DecisionStatus.PENDING,
          toStatus: DecisionStatus.REJECTED,
          changedBy: userId,
          reason: notes,
        },
      }),
    ]);

    return updated;
  }

  async getApprovals(id: string, tenantId: string) {
    // Verify decision
    const decision = await this.prisma.decisions.findFirst({
      where: {
        id,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
    });

    if (!decision) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Decision not found',
        404,
      );
    }

    return this.prisma.decisionApprovals.findMany({
      where: { decisionId: id },
      include: {
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        selectedOption: true,
      },
      orderBy: {
        approvedAt: 'desc',
      },
    });
  }

  async getStatusHistory(id: string, tenantId: string) {
    // Verify decision
    const decision = await this.prisma.decisions.findFirst({
      where: {
        id,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
    });

    if (!decision) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Decision not found',
        404,
      );
    }

    return this.prisma.decisionStatusHistory.findMany({
      where: { decisionId: id },
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
