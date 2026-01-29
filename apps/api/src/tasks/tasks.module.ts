import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { TaskAssignee } from './entities/task-assignee.entity';
import { TaskWatcher } from './entities/task-watcher.entity';
import { TaskStatusHistory } from './entities/task-status-history.entity';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TaskBlocksModule } from '../task-blocks/task-blocks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      TaskAssignee,
      TaskWatcher,
      TaskStatusHistory,
    ]),
    ActivityLogsModule,
    NotificationsModule,
    TaskBlocksModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
