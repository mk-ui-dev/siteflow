import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';
import { Delivery } from './entities/delivery.entity';
import { DeliveryItem } from './entities/delivery-item.entity';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { TaskBlocksModule } from '../task-blocks/task-blocks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Delivery, DeliveryItem]),
    ActivityLogsModule,
    TaskBlocksModule,
  ],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
