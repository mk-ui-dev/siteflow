import { Controller, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TasksRelationshipsService } from './tasks-relationships.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from '@siteflow/shared';

@ApiTags('tasks')
@Controller('tasks')
@ApiBearerAuth()
export class TasksRelationshipsController {
  constructor(private service: TasksRelationshipsService) {}

  // ========== BLOCKS ==========

  @Post(':id/blocks')
  @RequirePermissions(PERMISSIONS.TASK_EDIT)
  @ApiOperation({ summary: 'Create task block' })
  createBlock(
    @Param('id') taskId: string,
    @Body()
    body: {
      blockType: 'DELIVERY' | 'DECISION' | 'DEPENDENCY' | 'MANUAL';
      scope: 'START' | 'DONE';
      refEntityType?: string;
      refEntityId?: string;
      message: string;
    },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.createBlock(taskId, body, userId, tenantId);
  }

  @Delete(':id/blocks/:blockId')
  @RequirePermissions(PERMISSIONS.TASK_EDIT)
  @ApiOperation({ summary: 'Remove/resolve task block' })
  removeBlock(
    @Param('id') taskId: string,
    @Param('blockId') blockId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.removeBlock(taskId, blockId, userId, tenantId);
  }

  // ========== ASSIGNEES ==========

  @Post(':id/assignees')
  @RequirePermissions(PERMISSIONS.TASK_ASSIGN)
  @ApiOperation({ summary: 'Add assignee to task' })
  addAssignee(
    @Param('id') taskId: string,
    @Body() body: { userId: string },
    @CurrentUser('id') assignedBy: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.addAssignee(taskId, body.userId, assignedBy, tenantId);
  }

  @Delete(':id/assignees/:userId')
  @RequirePermissions(PERMISSIONS.TASK_ASSIGN)
  @ApiOperation({ summary: 'Remove assignee from task' })
  removeAssignee(
    @Param('id') taskId: string,
    @Param('userId') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.removeAssignee(taskId, userId, tenantId);
  }

  // ========== WATCHERS ==========

  @Post(':id/watchers')
  @RequirePermissions(PERMISSIONS.TASK_VIEW)
  @ApiOperation({ summary: 'Toggle watcher status (add/remove)' })
  toggleWatcher(
    @Param('id') taskId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.toggleWatcher(taskId, userId, tenantId);
  }

  // ========== DEPENDENCIES ==========

  @Post(':id/dependencies')
  @RequirePermissions(PERMISSIONS.TASK_EDIT)
  @ApiOperation({ summary: 'Create task dependency' })
  createDependency(
    @Param('id') dependentTaskId: string,
    @Body() body: { blockingTaskId: string },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.createDependency(
      dependentTaskId,
      body.blockingTaskId,
      userId,
      tenantId,
    );
  }

  @Delete(':id/dependencies/:blockingTaskId')
  @RequirePermissions(PERMISSIONS.TASK_EDIT)
  @ApiOperation({ summary: 'Remove task dependency' })
  removeDependency(
    @Param('id') dependentTaskId: string,
    @Param('blockingTaskId') blockingTaskId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.removeDependency(
      dependentTaskId,
      blockingTaskId,
      tenantId,
    );
  }

  // ========== TAGS ==========

  @Post(':id/tags')
  @RequirePermissions(PERMISSIONS.TASK_EDIT)
  @ApiOperation({ summary: 'Add tag to task' })
  addTag(
    @Param('id') taskId: string,
    @Body() body: { tagId: string },
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.addTag(taskId, body.tagId, tenantId);
  }

  @Delete(':id/tags/:tagId')
  @RequirePermissions(PERMISSIONS.TASK_EDIT)
  @ApiOperation({ summary: 'Remove tag from task' })
  removeTag(
    @Param('id') taskId: string,
    @Param('tagId') tagId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.removeTag(taskId, tagId, tenantId);
  }
}
