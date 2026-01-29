import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DecisionsService } from './decisions.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PERMISSIONS, DecisionStatus } from '@siteflow/shared';

@ApiTags('decisions')
@Controller('decisions')
@ApiBearerAuth()
export class DecisionsController {
  constructor(private service: DecisionsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.DECISION_VIEW)
  @ApiOperation({ summary: 'List decisions with filters' })
  findAll(
    @Query('projectId') projectId: string,
    @Query('status') status: DecisionStatus,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.findAll(tenantId, { projectId, status });
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.DECISION_VIEW)
  @ApiOperation({ summary: 'Get decision with options and approvals' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.findOne(id, tenantId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.DECISION_CREATE)
  @ApiOperation({ summary: 'Create decision' })
  create(
    @Body()
    body: {
      projectId: string;
      title: string;
      description: string;
      requiredApprovers: number;
      options?: Array<{
        optionText: string;
        order: number;
      }>;
    },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.create(body, userId, tenantId);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.DECISION_EDIT)
  @ApiOperation({ summary: 'Update decision' })
  update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      requiredApprovers?: number;
    },
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.update(id, body, tenantId);
  }

  @Post(':id/options')
  @RequirePermissions(PERMISSIONS.DECISION_EDIT)
  @ApiOperation({ summary: 'Add option to decision' })
  addOption(
    @Param('id') decisionId: string,
    @Body()
    body: {
      optionText: string;
      order: number;
    },
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.addOption(decisionId, body, tenantId);
  }

  @Put(':id/options/:optionId')
  @RequirePermissions(PERMISSIONS.DECISION_EDIT)
  @ApiOperation({ summary: 'Update decision option' })
  updateOption(
    @Param('id') decisionId: string,
    @Param('optionId') optionId: string,
    @Body()
    body: {
      optionText?: string;
      order?: number;
    },
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.updateOption(decisionId, optionId, body, tenantId);
  }

  @Delete(':id/options/:optionId')
  @RequirePermissions(PERMISSIONS.DECISION_EDIT)
  @ApiOperation({ summary: 'Delete decision option' })
  deleteOption(
    @Param('id') decisionId: string,
    @Param('optionId') optionId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.deleteOption(decisionId, optionId, tenantId);
  }

  @Post(':id/approve')
  @RequirePermissions(PERMISSIONS.DECISION_APPROVE)
  @ApiOperation({ summary: 'Approve decision' })
  approve(
    @Param('id') id: string,
    @Body()
    body: {
      selectedOptionId?: string;
      notes: string;
    },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.approve(id, body, userId, tenantId);
  }

  @Post(':id/reject')
  @RequirePermissions(PERMISSIONS.DECISION_APPROVE)
  @ApiOperation({ summary: 'Reject decision' })
  reject(
    @Param('id') id: string,
    @Body() body: { notes: string },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.reject(id, body.notes, userId, tenantId);
  }

  @Get(':id/approvals')
  @RequirePermissions(PERMISSIONS.DECISION_VIEW)
  @ApiOperation({ summary: 'Get all approvals for decision' })
  getApprovals(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.getApprovals(id, tenantId);
  }

  @Get(':id/status-history')
  @RequirePermissions(PERMISSIONS.DECISION_VIEW)
  @ApiOperation({ summary: 'Get decision status history' })
  getStatusHistory(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.getStatusHistory(id, tenantId);
  }
}
