import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskDependency } from './entities/task-dependency.entity';
import { Task, TaskStatus } from '../tasks/entities/task.entity';
import { CreateTaskDependencyDto } from './dto/create-task-dependency.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { TaskBlocksService } from '../task-blocks/task-blocks.service';
import { BlockType, BlockScope, EntityType } from '../task-blocks/entities/task-block.entity';

@Injectable()
export class TaskDependenciesService {
  constructor(
    @InjectRepository(TaskDependency)
    private taskDependenciesRepository: Repository<TaskDependency>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private activityLogsService: ActivityLogsService,
    private taskBlocksService: TaskBlocksService,
  ) {}

  /**
   * INV-10: Add dependency and create task block if blocker is not DONE
   */
  async create(
    dto: CreateTaskDependencyDto,
    userId: string,
  ): Promise<TaskDependency> {
    // Validate tasks exist
    const blockedTask = await this.tasksRepository.findOne({
      where: { id: dto.blocked_task_id },
    });
    const blockerTask = await this.tasksRepository.findOne({
      where: { id: dto.blocker_task_id },
    });

    if (!blockedTask) {
      throw new NotFoundException('Blocked task not found');
    }
    if (!blockerTask) {
      throw new NotFoundException('Blocker task not found');
    }

    // Validate not self-dependency
    if (dto.blocked_task_id === dto.blocker_task_id) {
      throw new BadRequestException('Task cannot depend on itself');
    }

    // Check for existing dependency
    const existing = await this.taskDependenciesRepository.findOne({
      where: {
        blocked_task_id: dto.blocked_task_id,
        blocker_task_id: dto.blocker_task_id,
      },
    });

    if (existing) {
      throw new ConflictException('Dependency already exists');
    }

    // Check for circular dependencies (simple DFS)
    if (await this.wouldCreateCycle(dto.blocked_task_id, dto.blocker_task_id)) {
      throw new ConflictException('Would create circular dependency');
    }

    // Create dependency
    const dependency = this.taskDependenciesRepository.create({
      blocked_task_id: dto.blocked_task_id,
      blocker_task_id: dto.blocker_task_id,
      created_by: userId,
    });

    const saved = await this.taskDependenciesRepository.save(dependency);

    // INV-10: Create task block if blocker is not DONE
    if (blockerTask.status !== TaskStatus.DONE) {
      await this.taskBlocksService.ensureBlock(
        dto.blocked_task_id,
        BlockType.DEPENDENCY,
        BlockScope.START,
        EntityType.TASK,
        dto.blocker_task_id,
        `Blocked by task: ${blockerTask.title}`,
        userId,
      );

      await this.activityLogsService.log({
        project_id: blockedTask.project_id,
        entity_type: 'TASK',
        entity_id: dto.blocked_task_id,
        action: 'BLOCKED',
        user_id: userId,
        details: {
          block_type: 'DEPENDENCY',
          blocker_task_id: dto.blocker_task_id,
          blocker_title: blockerTask.title,
        },
      });
    }

    await this.activityLogsService.log({
      project_id: blockedTask.project_id,
      entity_type: 'TASK',
      entity_id: dto.blocked_task_id,
      action: 'DEPENDENCY_ADDED',
      user_id: userId,
      details: { blocker_task_id: dto.blocker_task_id },
    });

    return saved;
  }

  async findAll(blockedTaskId: string): Promise<TaskDependency[]> {
    return this.taskDependenciesRepository.find({
      where: { blocked_task_id: blockedTaskId },
      relations: ['blocker_task'],
    });
  }

  async delete(
    blockedTaskId: string,
    blockerTaskId: string,
    userId: string,
  ): Promise<void> {
    const dependency = await this.taskDependenciesRepository.findOne({
      where: {
        blocked_task_id: blockedTaskId,
        blocker_task_id: blockerTaskId,
      },
    });

    if (!dependency) {
      throw new NotFoundException('Dependency not found');
    }

    // Disable related task blocks
    await this.taskBlocksService.disableByReference(
      EntityType.TASK,
      blockerTaskId,
    );

    const blockedTask = await this.tasksRepository.findOne({
      where: { id: blockedTaskId },
    });

    await this.activityLogsService.log({
      project_id: blockedTask.project_id,
      entity_type: 'TASK',
      entity_id: blockedTaskId,
      action: 'DEPENDENCY_REMOVED',
      user_id: userId,
      details: { blocker_task_id: blockerTaskId },
    });

    await this.taskDependenciesRepository.remove(dependency);
  }

  /**
   * This should be called when a blocker task transitions to DONE
   * to remove blocks for all dependent tasks
   */
  async onBlockerTaskCompleted(
    blockerTaskId: string,
    userId: string,
  ): Promise<void> {
    // Find all tasks blocked by this task
    const dependencies = await this.taskDependenciesRepository.find({
      where: { blocker_task_id: blockerTaskId },
      relations: ['blocked_task'],
    });

    // Disable all dependency blocks for this blocker
    await this.taskBlocksService.disableByReference(
      EntityType.TASK,
      blockerTaskId,
    );

    // Log unblock for each dependent task
    for (const dep of dependencies) {
      await this.activityLogsService.log({
        project_id: dep.blocked_task.project_id,
        entity_type: 'TASK',
        entity_id: dep.blocked_task_id,
        action: 'UNBLOCKED',
        user_id: userId,
        details: {
          block_type: 'DEPENDENCY',
          blocker_task_id: blockerTaskId,
          reason: 'Blocker task completed',
        },
      });
    }
  }

  /**
   * Simple DFS to detect cycles
   */
  private async wouldCreateCycle(
    blockedTaskId: string,
    blockerTaskId: string,
  ): Promise<boolean> {
    const visited = new Set<string>();
    const stack = [blockerTaskId];

    while (stack.length > 0) {
      const currentId = stack.pop();

      if (currentId === blockedTaskId) {
        return true; // Cycle detected
      }

      if (visited.has(currentId)) {
        continue;
      }

      visited.add(currentId);

      // Find tasks that current task blocks
      const dependencies = await this.taskDependenciesRepository.find({
        where: { blocker_task_id: currentId },
      });

      for (const dep of dependencies) {
        stack.push(dep.blocked_task_id);
      }
    }

    return false;
  }
}
