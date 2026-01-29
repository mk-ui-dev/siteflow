import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IssuesService } from './issues.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PERMISSIONS, IssueStatus, IssueSeverity } from '@siteflow/shared';

@ApiTags('issues')
@Controller('issues')
@ApiBearerAuth()
export class IssuesController {
  constructor(private service: IssuesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ISSUE_VIEW)
  @ApiOperation({ summary: 'List issues with filters' })
  findAll(
    @Query('projectId') projectId: string,
    @Query('status') status: IssueStatus,
    @Query('severity') severity: IssueSeverity,
    @Query('assigneeId') assigneeId: string,
    @Query('refEntityType') refEntityType: string,
    @Query('refEntityId') refEntityId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.findAll(tenantId, {
      projectId,
      status,
      severity,
      assigneeId,
      refEntityType,
      refEntityId,
    });
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.ISSUE_VIEW)
  @ApiOperation({ summary: 'Get issue with full details' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.findOne(id, tenantId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ISSUE_CREATE)
  @ApiOperation({ summary: 'Create issue linked to entity' })
  create(
    @Body()
    body: {
      projectId: string;
      title: string;
      description: string;
      severity: IssueSeverity;
      refEntityType?: 'TASK' | 'INSPECTION' | 'DELIVERY' | 'DECISION';
      refEntityId?: string;
    },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.create(body, userId, tenantId);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.ISSUE_EDIT)
  @ApiOperation({ summary: 'Update issue' })
  update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      severity?: IssueSeverity;
    },
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.update(id, body, tenantId);
  }

  @Post(':id/assign')
  @RequirePermissions(PERMISSIONS.ISSUE_EDIT)
  @ApiOperation({ summary: 'Assign issue to user (NEW → ASSIGNED)' })
  assign(
    @Param('id') id: string,
    @Body() body: { assigneeId: string },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.assign(id, body.assigneeId, userId, tenantId);
  }

  @Post(':id/start')
  @RequirePermissions(PERMISSIONS.ISSUE_EDIT)
  @ApiOperation({ summary: 'Start work on issue (ASSIGNED → IN_PROGRESS)' })
  start(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.start(id, userId, tenantId);
  }

  @Post(':id/fix')
  @RequirePermissions(PERMISSIONS.ISSUE_EDIT)
  @ApiOperation({ summary: 'Mark as fixed (IN_PROGRESS → FIXED)' })
  fix(
    @Param('id') id: string,
    @Body() body: { notes: string },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.fix(id, body.notes, userId, tenantId);
  }

  @Post(':id/verify')
  @RequirePermissions(PERMISSIONS.ISSUE_EDIT)
  @ApiOperation({ summary: 'Verify fix (FIXED → VERIFIED)' })
  verify(
    @Param('id') id: string,
    @Body() body: { notes: string },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.verify(id, body.notes, userId, tenantId);
  }

  @Post(':id/close')
  @RequirePermissions(PERMISSIONS.ISSUE_EDIT)
  @ApiOperation({ summary: 'Close issue (VERIFIED → CLOSED)' })
  close(
    @Param('id') id: string,
    @Body() body: { notes: string },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.close(id, body.notes, userId, tenantId);
  }

  @Post(':id/reopen')
  @RequirePermissions(PERMISSIONS.ISSUE_EDIT)
  @ApiOperation({ summary: 'Reopen issue (CLOSED → REOPENED)' })
  reopen(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.reopen(id, body.reason, userId, tenantId);
  }

  @Get(':id/status-history')
  @RequirePermissions(PERMISSIONS.ISSUE_VIEW)
  @ApiOperation({ summary: 'Get issue status history' })
  getStatusHistory(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.getStatusHistory(id, tenantId);
  }
}
