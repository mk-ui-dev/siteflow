import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskBlocksService } from './task-blocks.service';
import { TaskBlocksController, TaskBlockController } from './task-blocks.controller';
import { TaskBlock } from './entities/task-block.entity';
import { Task } from '../tasks/entities/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaskBlock, Task])],
  controllers: [TaskBlocksController, TaskBlockController],
  providers: [TaskBlocksService],
  exports: [TaskBlocksService],
})
export class TaskBlocksModule {}
