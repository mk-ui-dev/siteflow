import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DeliveriesService } from './deliveries.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PERMISSIONS, DeliveryStatus } from '@siteflow/shared';

@ApiTags('deliveries')
@Controller('deliveries')
@ApiBearerAuth()
export class DeliveriesController {
  constructor(private service: DeliveriesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.DELIVERY_VIEW)
  @ApiOperation({ summary: 'List deliveries with filters' })
  findAll(
    @Query('projectId') projectId: string,
    @Query('status') status: DeliveryStatus,
    @Query('expectedDateFrom') expectedDateFrom: Date,
    @Query('expectedDateTo') expectedDateTo: Date,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.findAll(tenantId, {
      projectId,
      status,
      expectedDateFrom,
      expectedDateTo,
    });
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.DELIVERY_VIEW)
  @ApiOperation({ summary: 'Get delivery with items' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.findOne(id, tenantId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.DELIVERY_CREATE)
  @ApiOperation({ summary: 'Request delivery' })
  create(
    @Body()
    body: {
      projectId: string;
      supplier: string;
      expectedDeliveryDate: Date;
      notes?: string;
      items: Array<{
        description: string;
        quantity: number;
        unit: string;
      }>;
    },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.create(body, userId, tenantId);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.DELIVERY_EDIT)
  @ApiOperation({ summary: 'Update delivery' })
  update(
    @Param('id') id: string,
    @Body()
    body: {
      supplier?: string;
      expectedDeliveryDate?: Date;
      notes?: string;
    },
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.update(id, body, tenantId);
  }

  @Post(':id/items')
  @RequirePermissions(PERMISSIONS.DELIVERY_EDIT)
  @ApiOperation({ summary: 'Add item to delivery' })
  addItem(
    @Param('id') deliveryId: string,
    @Body()
    body: {
      description: string;
      quantity: number;
      unit: string;
    },
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.addItem(deliveryId, body, tenantId);
  }

  @Put(':id/items/:itemId')
  @RequirePermissions(PERMISSIONS.DELIVERY_EDIT)
  @ApiOperation({ summary: 'Update delivery item' })
  updateItem(
    @Param('id') deliveryId: string,
    @Param('itemId') itemId: string,
    @Body()
    body: {
      description?: string;
      quantity?: number;
      unit?: string;
    },
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.updateItem(deliveryId, itemId, body, tenantId);
  }

  @Delete(':id/items/:itemId')
  @RequirePermissions(PERMISSIONS.DELIVERY_EDIT)
  @ApiOperation({ summary: 'Delete delivery item' })
  deleteItem(
    @Param('id') deliveryId: string,
    @Param('itemId') itemId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.deleteItem(deliveryId, itemId, tenantId);
  }

  @Post(':id/receive')
  @RequirePermissions(PERMISSIONS.DELIVERY_EDIT)
  @ApiOperation({ summary: 'Mark delivery as received (SCHEDULED → DELIVERED)' })
  receive(
    @Param('id') id: string,
    @Body() body: { actualDeliveryDate: Date },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.receive(id, body.actualDeliveryDate, userId, tenantId);
  }

  @Post(':id/confirm')
  @RequirePermissions(PERMISSIONS.DELIVERY_EDIT)
  @ApiOperation({ summary: 'Confirm delivery complete (DELIVERED → CONFIRMED)' })
  confirm(
    @Param('id') id: string,
    @Body() body: { notes: string },
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.confirm(id, body.notes, userId, tenantId);
  }

  @Get(':id/status-history')
  @RequirePermissions(PERMISSIONS.DELIVERY_VIEW)
  @ApiOperation({ summary: 'Get delivery status history' })
  getStatusHistory(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.getStatusHistory(id, tenantId);
  }
}
