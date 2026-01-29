import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppError, ErrorCode } from '@siteflow/shared';

@Injectable()
export class TasksRelationshipsService {
  constructor(private prisma: PrismaService) {}

  // ========== BLOCKS ==========

  async createBlock(
    taskId: string,
    data: {
      blockType: 'DELIVERY' | 'DECISION' | 'DEPENDENCY' | 'MANUAL';
      scope: 'START' | 'DONE';
      refEntityType?: string;
      refEntityId?: string;
      message: string;
    },
    userId: string,
    tenantId: string,
  ) {
    // Verify task
    const task = await this.prisma.tasks.findFirst({
      where: {
        id: taskId,
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

    return this.prisma.taskBlocks.create({
      data: {
        taskId,
        blockType: data.blockType,
        scope: data.scope,
        refEntityType: data.refEntityType as any,
        refEntityId: data.refEntityId,
        message: data.message,
        createdBy: userId,
      },
    });
  }

  async removeBlock(
    taskId: string,
    blockId: string,
    userId: string,
    tenantId: string,
  ) {
    // Verify task
    const task = await this.prisma.tasks.findFirst({
      where: {
        id: taskId,
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

    // Verify block belongs to task
    const block = await this.prisma.taskBlocks.findFirst({
      where: { id: blockId, taskId },
    });

    if (!block) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Block not found',
        404,
      );
    }

    // Resolve block
    return this.prisma.taskBlocks.update({
      where: { id: blockId },
      data: {
        isActive: false,
        resolvedAt: new Date(),
        resolvedBy: userId,
      },
    });
  }

  // ========== ASSIGNEES ==========

  async addAssignee(
    taskId: string,
    userId: string,
    assignedBy: string,
    tenantId: string,
  ) {
    // Verify task
    const task = await this.prisma.tasks.findFirst({
      where: {
        id: taskId,
        project: { tenantId, deletedAt: null },
        deletedAt: null,
      },
      include: {
        project: true,
      },
    });

    if (!task) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Task not found',
        404,
      );
    }

    // Verify user is project member
    const projectMember = await this.prisma.projectMembers.findFirst({
      where: {
        projectId: task.projectId,
        userId,
      },
    });

    if (!projectMember) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'User must be a project member',
        400,
      );
    }

    // Add assignee (idempotent)
    return this.prisma.taskAssignees.upsert({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
      create: {
        taskId,
        userId,
        assignedBy,
      },
      update: {},
    });
  }

  async removeAssignee(
    taskId: string,
    userId: string,
    tenantId: string,
  ) {
    // Verify task
    const task = await this.prisma.tasks.findFirst({
      where: {
        id: taskId,
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

    await this.prisma.taskAssignees.delete({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
    });

    return { message: 'Assignee removed' };
  }

  // ========== WATCHERS ==========

  async toggleWatcher(
    taskId: string,
    userId: string,
    tenantId: string,
  ) {
    // Verify task
    const task = await this.prisma.tasks.findFirst({
      where: {
        id: taskId,
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

    // Check if already watching
    const existing = await this.prisma.taskWatchers.findUnique({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
    });

    if (existing) {
      // Remove watcher
      await this.prisma.taskWatchers.delete({
        where: {
          taskId_userId: {
            taskId,
            userId,
          },
        },
      });
      return { watching: false };
    } else {
      // Add watcher
      await this.prisma.taskWatchers.create({
        data: {
          taskId,
          userId,
        },
      });
      return { watching: true };
    }
  }

  // ========== DEPENDENCIES ==========

  async createDependency(
    dependentTaskId: string,
    blockingTaskId: string,
    userId: string,
    tenantId: string,
  ) {
    // Verify both tasks
    const [dependentTask, blockingTask] = await Promise.all([
      this.prisma.tasks.findFirst({
        where: {
          id: dependentTaskId,
          project: { tenantId, deletedAt: null },
          deletedAt: null,
        },
      }),
      this.prisma.tasks.findFirst({
        where: {
          id: blockingTaskId,
          project: { tenantId, deletedAt: null },
          deletedAt: null,
        },
      }),
    ]);

    if (!dependentTask || !blockingTask) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'One or both tasks not found',
        404,
      );
    }

    // Must be in same project
    if (dependentTask.projectId !== blockingTask.projectId) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Tasks must be in the same project',
        400,
      );
    }

    // Cannot depend on self
    if (dependentTaskId === blockingTaskId) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Task cannot depend on itself',
        400,
      );
    }

    // Create dependency (idempotent)
    return this.prisma.taskDependencies.upsert({
      where: {
        dependentTaskId_blockingTaskId: {
          dependentTaskId,
          blockingTaskId,
        },
      },
      create: {
        dependentTaskId,
        blockingTaskId,
        createdBy: userId,
      },
      update: {},
    });
  }

  async removeDependency(
    dependentTaskId: string,
    blockingTaskId: string,
    tenantId: string,
  ) {
    // Verify dependent task
    const task = await this.prisma.tasks.findFirst({
      where: {
        id: dependentTaskId,
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

    await this.prisma.taskDependencies.delete({
      where: {
        dependentTaskId_blockingTaskId: {
          dependentTaskId,
          blockingTaskId,
        },
      },
    });

    return { message: 'Dependency removed' };
  }

  // ========== TAGS ==========

  async addTag(
    taskId: string,
    tagId: string,
    tenantId: string,
  ) {
    // Verify task
    const task = await this.prisma.tasks.findFirst({
      where: {
        id: taskId,
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

    // Verify tag belongs to tenant
    const tag = await this.prisma.tags.findFirst({
      where: { id: tagId, tenantId },
    });

    if (!tag) {
      throw new AppError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'Tag not found',
        404,
      );
    }

    // Add tag (idempotent)
    return this.prisma.taskTags.upsert({
      where: {
        taskId_tagId: {
          taskId,
          tagId,
        },
      },
      create: {
        taskId,
        tagId,
      },
      update: {},
    });
  }

  async removeTag(
    taskId: string,
    tagId: string,
    tenantId: string,
  ) {
    // Verify task
    const task = await this.prisma.tasks.findFirst({
      where: {
        id: taskId,
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

    await this.prisma.taskTags.delete({
      where: {
        taskId_tagId: {
          taskId,
          tagId,
        },
      },
    });

    return { message: 'Tag removed' };
  }
}
