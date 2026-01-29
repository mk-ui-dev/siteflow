import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PERMISSIONS, TaskStatus } from '@siteflow/shared';

@ApiTags('tasks')
@Controller('tasks')
@ApiBearerAuth()
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.TASK_VIEW)
  @ApiOperation({ summary: 'List all tasks in project' })
  findAll(
    @Query('projectId') projectId: string,
    @Query('status') status: TaskStatus,
    @Query('locationId') locationId: string,
    @Query('requiresInspection') requiresInspection: boolean,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.tasksService.findAll(projectId, tenantId, {
      status,
      locationId,
      requiresInspection,
    });
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.TASK_VIEW)
  @ApiOperation({ summary: 'Get task by ID with full details' })
  findOne(
    @Param('id') id: string,
    @Query('projectId') projectId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.tasksService.findOne(id, projectId, tenantId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.TASK_CREATE)
  @ApiOperation({ summary: 'Create new task' })
  create(
    @Body()
    body: {
      projectId: string;
      locationId?: string;
      title: string;
      description?: string;
      requiresInspection?: boolean;
      tagIds?: string[];
    },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.tasksService.create(body, userId, tenantId);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.TASK_EDIT)
  @ApiOperation({ summary: 'Update task' })
  update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      locationId?: string;
      requiresInspection?: boolean;
    },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.tasksService.update(id, body, userId, tenantId);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.TASK_DELETE)
  @ApiOperation({ summary: 'Soft delete task' })
  delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.tasksService.delete(id, userId, tenantId);
  }

  @Post(':id/plan')
  @RequirePermissions(PERMISSIONS.TASK_PLAN)
  @ApiOperation({ summary: 'Plan task - set date and assignees' })
  plan(
    @Param('id') id: string,
    @Body() body: { plannedDate: Date; assigneeIds: string[] },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.tasksService.planTask(id, body, userId, tenantId);
  }

  @Post(':id/start')
  @RequirePermissions(PERMISSIONS.TASK_START)
  @ApiOperation({ summary: 'Start task (INV-2: validates START blocks)' })
  start(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.tasksService.startTask(id, userId, tenantId);
  }

  @Post(':id/complete')
  @RequirePermissions(PERMISSIONS.TASK_COMPLETE)
  @ApiOperation({ summary: 'Complete task (INV-3: validates inspection)' })
  complete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.tasksService.completeTask(id, userId, tenantId);
  }

  @Get(':id/blocks')
  @RequirePermissions(PERMISSIONS.TASK_VIEW)
  @ApiOperation({ summary: 'Get active blocks for task' })
  getBlocks(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.tasksService.getBlocks(id, tenantId);
  }
}
