import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskDependenciesController } from './task-dependencies.controller';
import { TaskDependenciesService } from './task-dependencies.service';
import { TaskDependency } from './entities/task-dependency.entity';
import { Task } from '../tasks/entities/task.entity';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { TaskBlocksModule } from '../task-blocks/task-blocks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskDependency, Task]),
    ActivityLogsModule,
    TaskBlocksModule,
  ],
  controllers: [TaskDependenciesController],
  providers: [TaskDependenciesService],
  exports: [TaskDependenciesService],
})
export class TaskDependenciesModule {}
