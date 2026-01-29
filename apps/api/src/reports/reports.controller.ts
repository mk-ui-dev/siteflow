import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from '@siteflow/shared';

@ApiTags('reports')
@Controller('reports')
@ApiBearerAuth()
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('dashboard/:projectId')
  @RequirePermissions(PERMISSIONS.REPORT_VIEW)
  @ApiOperation({ summary: 'Get project dashboard overview' })
  getDashboard(
    @Param('projectId') projectId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.getDashboard(projectId, tenantId);
  }

  @Get('tasks-summary/:projectId')
  @RequirePermissions(PERMISSIONS.REPORT_VIEW)
  @ApiOperation({ summary: 'Get task statistics summary' })
  getTasksSummary(
    @Param('projectId') projectId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.getTasksSummary(projectId, tenantId);
  }

  @Get('inspections-summary/:projectId')
  @RequirePermissions(PERMISSIONS.REPORT_VIEW)
  @ApiOperation({ summary: 'Get inspection statistics summary' })
  getInspectionsSummary(
    @Param('projectId') projectId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.getInspectionsSummary(projectId, tenantId);
  }

  @Get('issues-summary/:projectId')
  @RequirePermissions(PERMISSIONS.REPORT_VIEW)
  @ApiOperation({ summary: 'Get issue statistics summary' })
  getIssuesSummary(
    @Param('projectId') projectId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.getIssuesSummary(projectId, tenantId);
  }

  @Get('timeline/:projectId')
  @RequirePermissions(PERMISSIONS.REPORT_VIEW)
  @ApiOperation({ summary: 'Get project timeline (last 30 days)' })
  getTimeline(
    @Param('projectId') projectId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.getTimeline(projectId, tenantId);
  }

  @Get('tasks-by-status/:projectId')
  @RequirePermissions(PERMISSIONS.REPORT_VIEW)
  @ApiOperation({ summary: 'Get tasks grouped by status' })
  getTasksByStatus(
    @Param('projectId') projectId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.getTasksByStatus(projectId, tenantId);
  }

  @Get('tasks-by-assignee/:projectId')
  @RequirePermissions(PERMISSIONS.REPORT_VIEW)
  @ApiOperation({ summary: 'Get workload per user' })
  getTasksByAssignee(
    @Param('projectId') projectId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.getTasksByAssignee(projectId, tenantId);
  }

  @Get('overdue-items/:projectId')
  @RequirePermissions(PERMISSIONS.REPORT_VIEW)
  @ApiOperation({ summary: 'Get overdue tasks and inspections' })
  getOverdueItems(
    @Param('projectId') projectId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.getOverdueItems(projectId, tenantId);
  }

  @Get('critical-issues/:projectId')
  @RequirePermissions(PERMISSIONS.REPORT_VIEW)
  @ApiOperation({ summary: 'Get high priority open issues' })
  getCriticalIssues(
    @Param('projectId') projectId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.getCriticalIssues(projectId, tenantId);
  }

  @Get('project-health/:projectId')
  @RequirePermissions(PERMISSIONS.REPORT_VIEW)
  @ApiOperation({ summary: 'Get overall project health score' })
  getProjectHealth(
    @Param('projectId') projectId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.getProjectHealth(projectId, tenantId);
  }
}
