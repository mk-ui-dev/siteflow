import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppError, ErrorCode, TaskStatus } from '@siteflow/shared';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId: string, tenantId: string) {
    // Verify project belongs to tenant
    const project = await this.prisma.projects.findFirst({
      where: { id: projectId, tenantId },
    });

    if (!project) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Project not found',
        404,
      );
    }

    return this.prisma.tasks.findMany({
      where: {
        projectId,
        deletedAt: null,
      },
      include: {
        location: true,
        blocks: {
          where: { isActive: true },
        },
      },
    });
  }

  async findOne(id: string, projectId: string, tenantId: string) {
    const task = await this.prisma.tasks.findFirst({
      where: {
        id,
        projectId,
        project: { tenantId },
        deletedAt: null,
      },
      include: {
        location: true,
        blocks: {
          where: { isActive: true },
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

  async updateStatus(
    id: string,
    status: TaskStatus,
    userId: string,
    tenantId: string,
  ) {
    const task = await this.prisma.tasks.findFirst({
      where: {
        id,
        project: { tenantId },
        deletedAt: null,
      },
      include: {
        blocks: {
          where: { isActive: true, scope: 'START' },
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

    // INV-2: Check START blocks
    if (status === TaskStatus.IN_PROGRESS && task.blocks.length > 0) {
      throw new AppError(
        ErrorCode.TASK_BLOCKED,
        'Cannot start task - active blocks exist',
        400,
        { blocks: task.blocks },
      );
    }

    return this.prisma.tasks.update({
      where: { id },
      data: {
        status,
        updatedBy: userId,
        ...(status === TaskStatus.IN_PROGRESS && { startedAt: new Date() }),
        ...(status === TaskStatus.DONE && { completedAt: new Date() }),
      },
    });
  }
}
