import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TasksRelationshipsService } from './tasks-relationships.service';
import { TasksRelationshipsController } from './tasks-relationships.controller';

@Module({
  controllers: [TasksController, TasksRelationshipsController],
  providers: [TasksService, TasksRelationshipsService],
  exports: [TasksService, TasksRelationshipsService],
})
export class TasksModule {}
