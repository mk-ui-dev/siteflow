import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery, DeliveryStatus } from './entities/delivery.entity';
import { DeliveryItem } from './entities/delivery-item.entity';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { TaskBlocksService } from '../task-blocks/task-blocks.service';
import { BlockType, BlockScope, EntityType } from '../task-blocks/entities/task-block.entity';

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Delivery)
    private deliveriesRepository: Repository<Delivery>,
    @InjectRepository(DeliveryItem)
    private deliveryItemsRepository: Repository<DeliveryItem>,
    private activityLogsService: ActivityLogsService,
    private taskBlocksService: TaskBlocksService,
  ) {}

  /**
   * INV-8: Create delivery and create task block if blocks_work=true
   */
  async create(
    projectId: string,
    dto: CreateDeliveryDto,
    userId: string,
  ): Promise<Delivery> {
    const delivery = this.deliveriesRepository.create({
      project_id: projectId,
      supplier_name: dto.supplier_name,
      expected_date: dto.expected_date,
      related_task_id: dto.related_task_id,
      location_id: dto.location_id,
      blocks_work: dto.blocks_work || false,
      status: DeliveryStatus.REQUESTED,
      created_by: userId,
      updated_by: userId,
    });

    const savedDelivery = await this.deliveriesRepository.save(delivery);

    // Create delivery items
    if (dto.items && dto.items.length > 0) {
      const items = dto.items.map((item) =>
        this.deliveryItemsRepository.create({
          delivery_id: savedDelivery.id,
          item_name: item.item_name,
          quantity: item.quantity,
          unit: item.unit,
        }),
      );
      await this.deliveryItemsRepository.save(items);
    }

    // INV-8: Create task block if blocks_work=true and related_task_id exists
    if (dto.blocks_work && dto.related_task_id) {
      await this.taskBlocksService.ensureBlock(
        dto.related_task_id,
        BlockType.DELIVERY,
        BlockScope.START,
        EntityType.DELIVERY,
        savedDelivery.id,
        `Waiting for delivery from ${dto.supplier_name}`,
        userId,
      );

      await this.activityLogsService.log({
        project_id: projectId,
        entity_type: 'TASK',
        entity_id: dto.related_task_id,
        action: 'BLOCKED',
        user_id: userId,
        details: {
          block_type: 'DELIVERY',
          delivery_id: savedDelivery.id,
          supplier: dto.supplier_name,
        },
      });
    }

    // Log activity
    await this.activityLogsService.log({
      project_id: projectId,
      entity_type: 'DELIVERY',
      entity_id: savedDelivery.id,
      action: 'CREATED',
      user_id: userId,
      details: { supplier: dto.supplier_name },
    });

    return savedDelivery;
  }

  async findAll(projectId: string): Promise<Delivery[]> {
    return this.deliveriesRepository.find({
      where: { project_id: projectId },
      relations: ['items', 'related_task', 'location'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Delivery> {
    const delivery = await this.deliveriesRepository.findOne({
      where: { id },
      relations: ['items', 'related_task', 'location', 'project'],
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    return delivery;
  }

  async update(
    id: string,
    dto: UpdateDeliveryDto,
    userId: string,
  ): Promise<Delivery> {
    const delivery = await this.findOne(id);

    Object.assign(delivery, {
      ...dto,
      updated_by: userId,
    });

    const updated = await this.deliveriesRepository.save(delivery);

    await this.activityLogsService.log({
      project_id: delivery.project_id,
      entity_type: 'DELIVERY',
      entity_id: id,
      action: 'UPDATED',
      user_id: userId,
      details: dto,
    });

    return updated;
  }

  /**
   * INV-8: Update delivery status and manage task blocks
   */
  async updateStatus(
    id: string,
    dto: UpdateDeliveryStatusDto,
    userId: string,
  ): Promise<Delivery> {
    const delivery = await this.findOne(id);
    const previousStatus = delivery.status;

    delivery.status = dto.status;
    delivery.status_reason = dto.status_reason;

    if (dto.status >= DeliveryStatus.DELIVERED) {
      delivery.delivered_at = new Date();
    }

    const updated = await this.deliveriesRepository.save(delivery);

    // INV-8: Manage task blocks based on delivery status
    if (delivery.blocks_work && delivery.related_task_id) {
      if (dto.status >= DeliveryStatus.DELIVERED) {
        // Disable task block when delivered
        await this.taskBlocksService.disableByReference(
          EntityType.DELIVERY,
          id,
        );

        await this.activityLogsService.log({
          project_id: delivery.project_id,
          entity_type: 'TASK',
          entity_id: delivery.related_task_id,
          action: 'UNBLOCKED',
          user_id: userId,
          details: {
            block_type: 'DELIVERY',
            delivery_id: id,
            reason: 'Delivery received',
          },
        });
      } else {
        // Ensure block is active if status < DELIVERED
        await this.taskBlocksService.ensureBlock(
          delivery.related_task_id,
          BlockType.DELIVERY,
          BlockScope.START,
          EntityType.DELIVERY,
          id,
          `Waiting for delivery from ${delivery.supplier_name}`,
          userId,
        );
      }
    }

    await this.activityLogsService.log({
      project_id: delivery.project_id,
      entity_type: 'DELIVERY',
      entity_id: id,
      action: 'STATUS_CHANGED',
      user_id: userId,
      details: {
        from: previousStatus,
        to: dto.status,
        reason: dto.status_reason,
      },
    });

    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    const delivery = await this.findOne(id);

    // Disable any related task blocks
    if (delivery.blocks_work && delivery.related_task_id) {
      await this.taskBlocksService.disableByReference(EntityType.DELIVERY, id);
    }

    await this.activityLogsService.log({
      project_id: delivery.project_id,
      entity_type: 'DELIVERY',
      entity_id: id,
      action: 'DELETED',
      user_id: userId,
      details: { supplier: delivery.supplier_name },
    });

    await this.deliveriesRepository.remove(delivery);
  }
}
