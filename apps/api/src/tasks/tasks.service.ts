import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppError, ErrorCode, TaskStatus } from '@siteflow/shared';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId: string, tenantId: string, filters?: any) {
    // Verify project belongs to tenant
    const project = await this.prisma.projects.findFirst({
      where: { id: projectId, tenantId, deletedAt: null },
    });

    if (!project) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Project not found',
        404,
      );
    }

    const where: any = {
      projectId,
      deletedAt: null,
    };

    // Apply filters
    if (filters?.status) where.status = filters.status;
    if (filters?.locationId) where.locationId = filters.locationId;
    if (filters?.requiresInspection !== undefined) {
      where.requiresInspection = filters.requiresInspection;
    }

    return this.prisma.tasks.findMany({
      where,
      include: {
        location: true,
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        watchers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        blocks: {
          where: { isActive: true },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, projectId: string, tenantId: string) {
    const task = await this.prisma.tasks.findFirst({
      where: {
        id,
        projectId,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
      include: {
        location: true,
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        watchers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        dependencies: {
          include: {
            blockingTask: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
        blocks: {
          where: { isActive: true },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        statusHistory: {
          orderBy: {
            changedAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!task) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Task not found',
        404,
      );
    }

    return task;
  }

  async create(
    data: {
      projectId: string;
      locationId?: string;
      title: string;
      description?: string;
      requiresInspection?: boolean;
      tagIds?: string[];
    },
    userId: string,
    tenantId: string,
  ) {
    // Verify project
    const project = await this.prisma.projects.findFirst({
      where: { id: data.projectId, tenantId, deletedAt: null },
    });

    if (!project) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Project not found',
        404,
      );
    }

    // Verify location if provided
    if (data.locationId) {
      const location = await this.prisma.locations.findFirst({
        where: {
          id: data.locationId,
          projectId: data.projectId,
          deletedAt: null,
        },
      });

      if (!location) {
        throw new AppError(
          ErrorCode.RESOURCE_NOT_FOUND,
          'Location not found',
          404,
        );
      }
    }

    // Create task
    const task = await this.prisma.tasks.create({
      data: {
        projectId: data.projectId,
        locationId: data.locationId,
        title: data.title,
        description: data.description || '',
        requiresInspection: data.requiresInspection || false,
        status: TaskStatus.NEW,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        location: true,
        assignees: true,
        blocks: true,
      },
    });

    // Add tags if provided
    if (data.tagIds && data.tagIds.length > 0) {
      await this.prisma.taskTags.createMany({
        data: data.tagIds.map((tagId) => ({
          taskId: task.id,
          tagId,
        })),
      });
    }

    return task;
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      locationId?: string;
      requiresInspection?: boolean;
    },
    userId: string,
    tenantId: string,
  ) {
    // Verify task exists and belongs to tenant
    const task = await this.prisma.tasks.findFirst({
      where: {
        id,
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

    // Verify location if changing
    if (data.locationId && data.locationId !== task.locationId) {
      const location = await this.prisma.locations.findFirst({
        where: {
          id: data.locationId,
          projectId: task.projectId,
          deletedAt: null,
        },
      });

      if (!location) {
        throw new AppError(
          ErrorCode.RESOURCE_NOT_FOUND,
          'Location not found',
          404,
        );
      }
    }

    return this.prisma.tasks.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
      include: {
        location: true,
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        blocks: {
          where: { isActive: true },
        },
      },
    });
  }

  async delete(id: string, userId: string, tenantId: string) {
    // Verify task exists
    const task = await this.prisma.tasks.findFirst({
      where: {
        id,
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

    // Soft delete
    return this.prisma.tasks.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  async planTask(
    id: string,
    data: {
      plannedDate: Date;
      assigneeIds: string[];
    },
    userId: string,
    tenantId: string,
  ) {
    // Verify task
    const task = await this.prisma.tasks.findFirst({
      where: {
        id,
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

    if (task.status !== TaskStatus.NEW) {
      throw new AppError(
        ErrorCode.TASK_INVALID_STATE,
        'Can only plan tasks in NEW status',
        400,
      );
    }

    // Verify assignees are project members
    const projectMembers = await this.prisma.projectMembers.findMany({
      where: {
        projectId: task.projectId,
        userId: { in: data.assigneeIds },
      },
    });

    if (projectMembers.length !== data.assigneeIds.length) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'All assignees must be project members',
        400,
      );
    }

    // Update task and add assignees
    const [updatedTask] = await this.prisma.$transaction([
      this.prisma.tasks.update({
        where: { id },
        data: {
          plannedDate: data.plannedDate,
          status: TaskStatus.PLANNED,
          updatedBy: userId,
        },
      }),
      // Add assignees
      this.prisma.taskAssignees.createMany({
        data: data.assigneeIds.map((assigneeId) => ({
          taskId: id,
          userId: assigneeId,
          assignedBy: userId,
        })),
        skipDuplicates: true,
      }),
      // Record status change
      this.prisma.taskStatusHistory.create({
        data: {
          taskId: id,
          fromStatus: TaskStatus.NEW,
          toStatus: TaskStatus.PLANNED,
          changedBy: userId,
        },
      }),
    ]);

    return updatedTask;
  }

  async startTask(id: string, userId: string, tenantId: string) {
    // Verify task
    const task = await this.prisma.tasks.findFirst({
      where: {
        id,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
      include: {
        blocks: {
          where: { isActive: true, scope: 'START' },
        },
        assignees: true,
      },
    });

    if (!task) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Task not found',
        404,
      );
    }

    if (task.status !== TaskStatus.PLANNED) {
      throw new AppError(
        ErrorCode.TASK_INVALID_STATE,
        'Task must be PLANNED before starting',
        400,
      );
    }

    // INV-2: Check START blocks
    if (task.blocks.length > 0) {
      throw new AppError(
        ErrorCode.TASK_BLOCKED,
        'Cannot start task - active START blocks exist',
        400,
        { blocks: task.blocks },
      );
    }

    if (task.assignees.length === 0) {
      throw new AppError(
        ErrorCode.TASK_MISSING_ASSIGNEES,
        'Task must have at least one assignee',
        400,
      );
    }

    // Update status
    const [updatedTask] = await this.prisma.$transaction([
      this.prisma.tasks.update({
        where: { id },
        data: {
          status: TaskStatus.IN_PROGRESS,
          startedAt: new Date(),
          updatedBy: userId,
        },
      }),
      this.prisma.taskStatusHistory.create({
        data: {
          taskId: id,
          fromStatus: TaskStatus.PLANNED,
          toStatus: TaskStatus.IN_PROGRESS,
          changedBy: userId,
        },
      }),
    ]);

    return updatedTask;
  }

  async completeTask(id: string, userId: string, tenantId: string) {
    // Verify task
    const task = await this.prisma.tasks.findFirst({
      where: {
        id,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
      include: {
        blocks: {
          where: { isActive: true, scope: 'DONE' },
        },
        inspections: {
          where: {
            deletedAt: null,
            status: 'APPROVED',
          },
        },
      },
    });

    if (!task) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Task not found',
        404,
      );
    }

    if (task.status !== TaskStatus.IN_PROGRESS && task.status !== TaskStatus.READY_FOR_REVIEW) {
      throw new AppError(
        ErrorCode.TASK_INVALID_STATE,
        'Task must be IN_PROGRESS or READY_FOR_REVIEW',
        400,
      );
    }

    // INV-3: Check inspection requirement
    if (task.requiresInspection && task.inspections.length === 0) {
      throw new AppError(
        ErrorCode.TASK_REQUIRES_INSPECTION,
        'Task requires approved inspection before completion',
        400,
      );
    }

    // Check DONE blocks
    if (task.blocks.length > 0) {
      throw new AppError(
        ErrorCode.TASK_BLOCKED,
        'Cannot complete task - active DONE blocks exist',
        400,
        { blocks: task.blocks },
      );
    }

    // Complete task
    const [updatedTask] = await this.prisma.$transaction([
      this.prisma.tasks.update({
        where: { id },
        data: {
          status: TaskStatus.DONE,
          completedAt: new Date(),
          updatedBy: userId,
        },
      }),
      this.prisma.taskStatusHistory.create({
        data: {
          taskId: id,
          fromStatus: task.status,
          toStatus: TaskStatus.DONE,
          changedBy: userId,
        },
      }),
    ]);

    return updatedTask;
  }

  async getBlocks(id: string, tenantId: string) {
    // Verify task
    const task = await this.prisma.tasks.findFirst({
      where: {
        id,
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

    return this.prisma.taskBlocks.findMany({
      where: {
        taskId: id,
        isActive: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}
