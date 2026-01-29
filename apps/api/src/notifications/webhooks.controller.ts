import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from '@siteflow/shared';

@ApiTags('webhooks')
@Controller('webhooks')
@ApiBearerAuth()
export class WebhooksController {
  constructor(private service: WebhooksService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.WEBHOOK_CREATE)
  @ApiOperation({ summary: 'Create webhook' })
  create(
    @Body()
    body: {
      projectId: string;
      url: string;
      eventTypes: string[];
      secret?: string;
    },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.create(body, userId, tenantId);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.WEBHOOK_VIEW)
  @ApiOperation({ summary: 'List webhooks for project' })
  findAll(
    @Query('projectId') projectId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.findAll(projectId, tenantId);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.WEBHOOK_EDIT)
  @ApiOperation({ summary: 'Update webhook' })
  update(
    @Param('id') id: string,
    @Body()
    body: {
      url?: string;
      eventTypes?: string[];
      secret?: string;
      isActive?: boolean;
    },
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.update(id, body, tenantId);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.WEBHOOK_DELETE)
  @ApiOperation({ summary: 'Delete webhook' })
  delete(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.delete(id, tenantId);
  }
}
