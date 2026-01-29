import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChecklistTemplatesService } from './checklist-templates.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PERMISSIONS, ChecklistItemType } from '@siteflow/shared';

@ApiTags('checklist-templates')
@Controller('checklist-templates')
@ApiBearerAuth()
export class ChecklistTemplatesController {
  constructor(private service: ChecklistTemplatesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.CHECKLIST_VIEW)
  @ApiOperation({ summary: 'List checklist templates' })
  findAll(
    @Query('discipline') discipline: string,
    @Query('isActive') isActive: boolean,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.findAll(tenantId, { discipline, isActive });
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.CHECKLIST_VIEW)
  @ApiOperation({ summary: 'Get template with items' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.findOne(id, tenantId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CHECKLIST_CREATE)
  @ApiOperation({ summary: 'Create checklist template with items' })
  create(
    @Body()
    body: {
      name: string;
      discipline: string;
      items: Array<{
        questionText: string;
        itemType: ChecklistItemType;
        isRequired: boolean;
        requiresPhoto: boolean;
        optionsJson?: any;
        order: number;
      }>;
    },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.create(body, userId, tenantId);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.CHECKLIST_EDIT)
  @ApiOperation({ summary: 'Update template metadata' })
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; discipline?: string; isActive?: boolean },
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.update(id, body, tenantId);
  }

  @Post(':id/items')
  @RequirePermissions(PERMISSIONS.CHECKLIST_EDIT)
  @ApiOperation({ summary: 'Add item to template' })
  addItem(
    @Param('id') templateId: string,
    @Body()
    body: {
      questionText: string;
      itemType: ChecklistItemType;
      isRequired: boolean;
      requiresPhoto: boolean;
      optionsJson?: any;
      order: number;
    },
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.addItem(templateId, body, tenantId);
  }

  @Put(':id/items/:itemId')
  @RequirePermissions(PERMISSIONS.CHECKLIST_EDIT)
  @ApiOperation({ summary: 'Update checklist item' })
  updateItem(
    @Param('id') templateId: string,
    @Param('itemId') itemId: string,
    @Body()
    body: {
      questionText?: string;
      isRequired?: boolean;
      requiresPhoto?: boolean;
      optionsJson?: any;
      order?: number;
    },
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.updateItem(templateId, itemId, body, tenantId);
  }

  @Delete(':id/items/:itemId')
  @RequirePermissions(PERMISSIONS.CHECKLIST_EDIT)
  @ApiOperation({ summary: 'Delete checklist item' })
  deleteItem(
    @Param('id') templateId: string,
    @Param('itemId') itemId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.deleteItem(templateId, itemId, tenantId);
  }
}
