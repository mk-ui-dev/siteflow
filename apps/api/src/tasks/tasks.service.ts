import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { TaskAssignee } from './entities/task-assignee.entity';
import { TaskWatcher } from './entities/task-watcher.entity';
import { TaskStatusHistory } from './entities/task-status-history.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PlanTaskDto } from './dto/plan-task.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TaskBlocksService } from '../task-blocks/task-blocks.service';
import { BlockScope } from '../task-blocks/entities/task-block.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(TaskAssignee)
    private taskAssigneesRepository: Repository<TaskAssignee>,
    @InjectRepository(TaskWatcher)
    private taskWatchersRepository: Repository<TaskWatcher>,
    @InjectRepository(TaskStatusHistory)
    private taskStatusHistoryRepository: Repository<TaskStatusHistory>,
    private activityLogsService: ActivityLogsService,
    private notificationsService: NotificationsService,
    private taskBlocksService: TaskBlocksService,
  ) {}

  async create(projectId: string, dto: CreateTaskDto, userId: string): Promise<Task> {
    const task = this.tasksRepository.create({
      project_id: projectId,
      title: dto.title,
      description: dto.description || '',
      location_id: dto.location_id,
      priority: dto.priority || 3,
      planned_date: dto.planned_date,
      due_date: dto.due_date,
      requires_inspection: dto.requires_inspection || false,
      status: TaskStatus.NEW,
      created_by: userId,
      updated_by: userId,
    });

    const savedTask = await this.tasksRepository.save(task);

    // Add assignees if provided
    if (dto.assignee_ids && dto.assignee_ids.length > 0) {
      await this.addAssignees(savedTask.id, dto.assignee_ids);
    }

    // Log activity
    await this.activityLogsService.log({
      project_id: projectId,
      entity_type: 'TASK',
      entity_id: savedTask.id,
      action: 'CREATED',
      user_id: userId,
      details: { title: dto.title },
    });

    return savedTask;
  }

  async findAll(projectId: string, userId?: string): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { project_id: projectId },
      relations: ['assignees', 'location'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['assignees', 'watchers', 'location', 'project'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(id: string, dto: UpdateTaskDto, userId: string): Promise<Task> {
    const task = await this.findOne(id);

    Object.assign(task, {
      ...dto,
      updated_by: userId,
    });

    const updated = await this.tasksRepository.save(task);

    // Log activity
    await this.activityLogsService.log({
      project_id: task.project_id,
      entity_type: 'TASK',
      entity_id: id,
      action: 'UPDATED',
      user_id: userId,
      details: dto,
    });

    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    const task = await this.findOne(id);

    await this.activityLogsService.log({
      project_id: task.project_id,
      entity_type: 'TASK',
      entity_id: id,
      action: 'DELETED',
      user_id: userId,
      details: { title: task.title },
    });

    await this.tasksRepository.remove(task);
  }

  /**
   * INV-1: Plan task (requires planned_date + assignees)
   */
  async planTask(id: string, dto: PlanTaskDto, userId: string): Promise<Task> {
    const task = await this.findOne(id);

    // INV-1 validation
    if (!dto.planned_date) {
      throw new BadRequestException('INV-1: planned_date is required');
    }

    if (!dto.assignee_ids || dto.assignee_ids.length === 0) {
      throw new BadRequestException('INV-1: At least one assignee is required');
    }

    // Update task
    task.planned_date = dto.planned_date;
    task.status = TaskStatus.PLANNED;
    task.updated_by = userId;

    const updated = await this.tasksRepository.save(task);

    // Update assignees
    await this.taskAssigneesRepository.delete({ task_id: id });
    await this.addAssignees(id, dto.assignee_ids);

    // Add status history
    await this.addStatusHistory(id, task.status, TaskStatus.PLANNED, userId);

    // Log activity
    await this.activityLogsService.log({
      project_id: task.project_id,
      entity_type: 'TASK',
      entity_id: id,
      action: 'PLANNED',
      user_id: userId,
      details: { planned_date: dto.planned_date },
    });

    return updated;
  }

  /**
   * INV-2: Start task (requires no active START blocks)
   */
  async startTask(id: string, userId: string): Promise<Task> {
    const task = await this.findOne(id);

    // INV-2: Check for active START blocks
    const activeBlocks = await this.taskBlocksService.getActiveBlocks(
      id,
      BlockScope.START,
    );

    if (activeBlocks.length > 0) {
      const blockMessages = activeBlocks.map((b) => b.message).join('; ');
      throw new ConflictException(
        `INV-2: Cannot start task. Active blocks: ${blockMessages}`,
      );
    }

    // Update status
    const previousStatus = task.status;
    task.status = TaskStatus.IN_PROGRESS;
    task.updated_by = userId;

    const updated = await this.tasksRepository.save(task);

    // Add status history
    await this.addStatusHistory(id, previousStatus, TaskStatus.IN_PROGRESS, userId);

    // Log activity
    await this.activityLogsService.log({
      project_id: task.project_id,
      entity_type: 'TASK',
      entity_id: id,
      action: 'STARTED',
      user_id: userId,
      details: {},
    });

    return updated;
  }

  async completeTask(id: string, userId: string): Promise<Task> {
    const task = await this.findOne(id);

    // INV-3: Check if inspection is required and approved
    if (task.requires_inspection) {
      // This check will be added when inspections module is integrated
      // For now, just log a warning
    }

    const previousStatus = task.status;
    task.status = TaskStatus.DONE;
    task.updated_by = userId;

    const updated = await this.tasksRepository.save(task);

    // Add status history
    await this.addStatusHistory(id, previousStatus, TaskStatus.DONE, userId);

    // Log activity
    await this.activityLogsService.log({
      project_id: task.project_id,
      entity_type: 'TASK',
      entity_id: id,
      action: 'COMPLETED',
      user_id: userId,
      details: {},
    });

    return updated;
  }

  private async addAssignees(taskId: string, userIds: string[]): Promise<void> {
    const assignees = userIds.map((userId) =>
      this.taskAssigneesRepository.create({ task_id: taskId, user_id: userId }),
    );

    await this.taskAssigneesRepository.save(assignees);
  }

  private async addStatusHistory(
    taskId: string,
    fromStatus: TaskStatus,
    toStatus: TaskStatus,
    userId: string,
  ): Promise<void> {
    const history = this.taskStatusHistoryRepository.create({
      task_id: taskId,
      from_status: fromStatus,
      to_status: toStatus,
      changed_by: userId,
    });

    await this.taskStatusHistoryRepository.save(history);
  }
}
