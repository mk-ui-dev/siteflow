import { Controller, Get, Param, Patch, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
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
  findAll(
    @Query('projectId') projectId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.tasksService.findAll(projectId, tenantId);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.TASK_VIEW)
  findOne(
    @Param('id') id: string,
    @Query('projectId') projectId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.tasksService.findOne(id, projectId, tenantId);
  }

  @Patch(':id/status')
  @RequirePermissions(PERMISSIONS.TASK_START, PERMISSIONS.TASK_COMPLETE)
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: TaskStatus },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.tasksService.updateStatus(id, body.status, userId, tenantId);
  }
}
