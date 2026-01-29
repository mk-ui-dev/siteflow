import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppError, ErrorCode, InspectionStatus } from '@siteflow/shared';

@Injectable()
export class InspectionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    filters?: {
      taskId?: string;
      status?: InspectionStatus;
      inspectorId?: string;
    },
  ) {
    const where: any = {
      task: {
        project: { tenantId, deletedAt: null },
      },
      deletedAt: null,
    };

    if (filters?.taskId) where.taskId = filters.taskId;
    if (filters?.status) where.status = filters.status;
    if (filters?.inspectorId) where.inspectorId = filters.inspectorId;

    return this.prisma.inspections.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        inspector: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        checklistTemplate: {
          select: {
            id: true,
            name: true,
            discipline: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const inspection = await this.prisma.inspections.findFirst({
      where: {
        id,
        task: {
          project: { tenantId, deletedAt: null },
        },
        deletedAt: null,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            requiresInspection: true,
          },
        },
        inspector: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        checklistTemplate: {
          include: {
            items: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
        checklistRun: {
          include: {
            answers: {
              include: {
                templateItem: true,
                photos: true,
              },
            },
          },
        },
        statusHistory: {
          orderBy: {
            changedAt: 'desc',
          },
        },
      },
    });

    if (!inspection) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Inspection not found',
        404,
      );
    }

    return inspection;
  }

  async create(
    data: {
      taskId: string;
      checklistTemplateId: string;
      inspectorId?: string;
    },
    userId: string,
    tenantId: string,
  ) {
    // Verify task
    const task = await this.prisma.tasks.findFirst({
      where: {
        id: data.taskId,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
    });

    if (!task) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Task not found',
        404,
      );
    }

    if (!task.requiresInspection) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Task does not require inspection',
        400,
      );
    }

    // Verify template
    const template = await this.prisma.checklistTemplates.findFirst({
      where: {
        id: data.checklistTemplateId,
        tenantId,
        isActive: true,
      },
    });

    if (!template) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Checklist template not found',
        404,
      );
    }

    // Verify inspector if provided
    if (data.inspectorId) {
      const inspector = await this.prisma.projectMembers.findFirst({
        where: {
          projectId: task.projectId,
          userId: data.inspectorId,
        },
      });

      if (!inspector) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Inspector must be a project member',
          400,
        );
      }
    }

    // Create inspection with checklist run
    const inspection = await this.prisma.inspections.create({
      data: {
        taskId: data.taskId,
        checklistTemplateId: data.checklistTemplateId,
        inspectorId: data.inspectorId,
        status: InspectionStatus.DRAFT,
        createdBy: userId,
        checklistRun: {
          create: {
            checklistTemplateId: data.checklistTemplateId,
          },
        },
      },
      include: {
        checklistRun: true,
        checklistTemplate: {
          include: {
            items: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });

    return inspection;
  }

  async submitChecklistAnswers(
    inspectionId: string,
    answers: Array<{
      templateItemId: string;
      answerBool?: boolean;
      answerText?: string;
      answerNumber?: number;
    }>,
    tenantId: string,
  ) {
    // Verify inspection
    const inspection = await this.prisma.inspections.findFirst({
      where: {
        id: inspectionId,
        task: {
          project: { tenantId, deletedAt: null },
        },
        deletedAt: null,
      },
      include: {
        checklistRun: true,
      },
    });

    if (!inspection) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Inspection not found',
        404,
      );
    }

    if (inspection.status !== InspectionStatus.DRAFT) {
      throw new AppError(
        ErrorCode.INSPECTION_INVALID_STATE,
        'Can only update answers in DRAFT status',
        400,
      );
    }

    // Upsert answers
    for (const answer of answers) {
      await this.prisma.checklistRunAnswers.upsert({
        where: {
          runId_templateItemId: {
            runId: inspection.checklistRun.id,
            templateItemId: answer.templateItemId,
          },
        },
        create: {
          runId: inspection.checklistRun.id,
          templateItemId: answer.templateItemId,
          answerBool: answer.answerBool,
          answerText: answer.answerText,
          answerNumber: answer.answerNumber,
        },
        update: {
          answerBool: answer.answerBool,
          answerText: answer.answerText,
          answerNumber: answer.answerNumber,
        },
      });
    }

    return { message: 'Answers saved' };
  }

  async submit(inspectionId: string, userId: string, tenantId: string) {
    // Get inspection with full details
    const inspection = await this.prisma.inspections.findFirst({
      where: {
        id: inspectionId,
        task: {
          project: { tenantId, deletedAt: null },
        },
        deletedAt: null,
      },
      include: {
        checklistTemplate: {
          include: {
            items: true,
          },
        },
        checklistRun: {
          include: {
            answers: {
              include: {
                photos: true,
              },
            },
          },
        },
      },
    });

    if (!inspection) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Inspection not found',
        404,
      );
    }

    if (inspection.status !== InspectionStatus.DRAFT) {
      throw new AppError(
        ErrorCode.INSPECTION_INVALID_STATE,
        'Can only submit inspections in DRAFT status',
        400,
      );
    }

    // INV-5: Validate all required items are answered
    const requiredItems = inspection.checklistTemplate.items.filter(
      (item) => item.isRequired,
    );
    const answeredItemIds = inspection.checklistRun.answers.map(
      (a) => a.templateItemId,
    );

    const missingItems = requiredItems.filter(
      (item) => !answeredItemIds.includes(item.id),
    );

    if (missingItems.length > 0) {
      throw new AppError(
        ErrorCode.INSPECTION_INCOMPLETE_CHECKLIST,
        'All required checklist items must be answered',
        400,
        {
          missingItems: missingItems.map((i) => ({
            id: i.id,
            question: i.questionText,
          })),
        },
      );
    }

    // INV-4: Validate photo requirements
    const photoRequiredItems = inspection.checklistTemplate.items.filter(
      (item) => item.requiresPhoto,
    );

    for (const item of photoRequiredItems) {
      const answer = inspection.checklistRun.answers.find(
        (a) => a.templateItemId === item.id,
      );

      if (!answer || answer.photos.length === 0) {
        throw new AppError(
          ErrorCode.INSPECTION_MISSING_PHOTOS,
          'Items requiring photos must have at least one photo attached',
          400,
          {
            itemId: item.id,
            question: item.questionText,
          },
        );
      }
    }

    // Update status
    const [updated] = await this.prisma.$transaction([
      this.prisma.inspections.update({
        where: { id: inspectionId },
        data: {
          status: InspectionStatus.SUBMITTED,
          submittedAt: new Date(),
          submittedBy: userId,
        },
      }),
      this.prisma.inspectionStatusHistory.create({
        data: {
          inspectionId,
          fromStatus: InspectionStatus.DRAFT,
          toStatus: InspectionStatus.SUBMITTED,
          changedBy: userId,
        },
      }),
    ]);

    return updated;
  }

  async approve(
    inspectionId: string,
    notes: string,
    userId: string,
    tenantId: string,
    userRole: string,
  ) {
    // Verify user has INSPECTOR role
    if (userRole !== 'INSPECTOR' && userRole !== 'ADMIN') {
      throw new AppError(
        ErrorCode.PERMISSION_DENIED,
        'Only inspectors can approve inspections',
        403,
      );
    }

    // Get inspection
    const inspection = await this.prisma.inspections.findFirst({
      where: {
        id: inspectionId,
        task: {
          project: { tenantId, deletedAt: null },
        },
        deletedAt: null,
      },
      include: {
        task: true,
      },
    });

    if (!inspection) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Inspection not found',
        404,
      );
    }

    if (inspection.status !== InspectionStatus.SUBMITTED) {
      throw new AppError(
        ErrorCode.INSPECTION_INVALID_STATE,
        'Can only approve SUBMITTED inspections',
        400,
      );
    }

    // Approve inspection
    const [updated] = await this.prisma.$transaction([
      this.prisma.inspections.update({
        where: { id: inspectionId },
        data: {
          status: InspectionStatus.APPROVED,
          reviewedAt: new Date(),
          reviewedBy: userId,
          reviewNotes: notes,
        },
      }),
      this.prisma.inspectionStatusHistory.create({
        data: {
          inspectionId,
          fromStatus: InspectionStatus.SUBMITTED,
          toStatus: InspectionStatus.APPROVED,
          changedBy: userId,
          reason: notes,
        },
      }),
    ]);

    // Remove DONE blocks related to this inspection
    await this.prisma.taskBlocks.updateMany({
      where: {
        taskId: inspection.taskId,
        refEntityType: 'INSPECTION',
        refEntityId: inspectionId,
        scope: 'DONE',
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

  async reject(
    inspectionId: string,
    notes: string,
    userId: string,
    tenantId: string,
    userRole: string,
  ) {
    // Verify user has INSPECTOR role
    if (userRole !== 'INSPECTOR' && userRole !== 'ADMIN') {
      throw new AppError(
        ErrorCode.PERMISSION_DENIED,
        'Only inspectors can reject inspections',
        403,
      );
    }

    // Get inspection
    const inspection = await this.prisma.inspections.findFirst({
      where: {
        id: inspectionId,
        task: {
          project: { tenantId, deletedAt: null },
        },
        deletedAt: null,
      },
    });

    if (!inspection) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Inspection not found',
        404,
      );
    }

    if (inspection.status !== InspectionStatus.SUBMITTED) {
      throw new AppError(
        ErrorCode.INSPECTION_INVALID_STATE,
        'Can only reject SUBMITTED inspections',
        400,
      );
    }

    // Reject inspection
    const [updated] = await this.prisma.$transaction([
      this.prisma.inspections.update({
        where: { id: inspectionId },
        data: {
          status: InspectionStatus.REJECTED,
          reviewedAt: new Date(),
          reviewedBy: userId,
          reviewNotes: notes,
        },
      }),
      this.prisma.inspectionStatusHistory.create({
        data: {
          inspectionId,
          fromStatus: InspectionStatus.SUBMITTED,
          toStatus: InspectionStatus.REJECTED,
          changedBy: userId,
          reason: notes,
        },
      }),
    ]);

    return updated;
  }

  async getStatusHistory(inspectionId: string, tenantId: string) {
    // Verify inspection
    const inspection = await this.prisma.inspections.findFirst({
      where: {
        id: inspectionId,
        task: {
          project: { tenantId, deletedAt: null },
        },
        deletedAt: null,
      },
    });

    if (!inspection) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Inspection not found',
        404,
      );
    }

    return this.prisma.inspectionStatusHistory.findMany({
      where: {
        inspectionId,
      },
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
