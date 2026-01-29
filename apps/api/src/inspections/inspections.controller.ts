import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InspectionsService } from './inspections.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PERMISSIONS, InspectionStatus } from '@siteflow/shared';

@ApiTags('inspections')
@Controller('inspections')
@ApiBearerAuth()
export class InspectionsController {
  constructor(private service: InspectionsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.INSPECTION_VIEW)
  @ApiOperation({ summary: 'List inspections with filters' })
  findAll(
    @Query('taskId') taskId: string,
    @Query('status') status: InspectionStatus,
    @Query('inspectorId') inspectorId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.findAll(tenantId, { taskId, status, inspectorId });
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.INSPECTION_VIEW)
  @ApiOperation({ summary: 'Get inspection with full checklist details' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.findOne(id, tenantId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.INSPECTION_CREATE)
  @ApiOperation({ summary: 'Create inspection for task' })
  create(
    @Body()
    body: {
      taskId: string;
      checklistTemplateId: string;
      inspectorId?: string;
    },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.create(body, userId, tenantId);
  }

  @Post(':id/checklist')
  @RequirePermissions(PERMISSIONS.INSPECTION_EDIT)
  @ApiOperation({ summary: 'Submit checklist answers' })
  submitChecklist(
    @Param('id') inspectionId: string,
    @Body()
    body: {
      answers: Array<{
        templateItemId: string;
        answerBool?: boolean;
        answerText?: string;
        answerNumber?: number;
      }>;
    },
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.submitChecklistAnswers(
      inspectionId,
      body.answers,
      tenantId,
    );
  }

  @Post(':id/submit')
  @RequirePermissions(PERMISSIONS.INSPECTION_SUBMIT)
  @ApiOperation({
    summary: 'Submit inspection for review (INV-4 & INV-5 validation)',
  })
  submit(
    @Param('id') inspectionId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.submit(inspectionId, userId, tenantId);
  }

  @Post(':id/approve')
  @RequirePermissions(PERMISSIONS.INSPECTION_REVIEW)
  @ApiOperation({ summary: 'Approve inspection (INSPECTOR role only)' })
  approve(
    @Param('id') inspectionId: string,
    @Body() body: { notes: string },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.service.approve(
      inspectionId,
      body.notes,
      userId,
      tenantId,
      userRole,
    );
  }

  @Post(':id/reject')
  @RequirePermissions(PERMISSIONS.INSPECTION_REVIEW)
  @ApiOperation({ summary: 'Reject inspection with notes' })
  reject(
    @Param('id') inspectionId: string,
    @Body() body: { notes: string },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.service.reject(
      inspectionId,
      body.notes,
      userId,
      tenantId,
      userRole,
    );
  }

  @Get(':id/status-history')
  @RequirePermissions(PERMISSIONS.INSPECTION_VIEW)
  @ApiOperation({ summary: 'Get inspection status history' })
  getStatusHistory(
    @Param('id') inspectionId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.getStatusHistory(inspectionId, tenantId);
  }
}
