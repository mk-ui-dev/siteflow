import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskBlock, BlockType, BlockScope, EntityType } from './entities/task-block.entity';
import { CreateTaskBlockDto } from './dto/create-task-block.dto';
import { Task } from '../tasks/entities/task.entity';

@Injectable()
export class TaskBlocksService {
  constructor(
    @InjectRepository(TaskBlock)
    private taskBlocksRepository: Repository<TaskBlock>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  /**
   * Create a new task block
   */
  async create(
    taskId: string,
    dto: CreateTaskBlockDto,
    userId: string,
  ): Promise<TaskBlock> {
    const task = await this.tasksRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const block = this.taskBlocksRepository.create({
      task_id: taskId,
      block_type: dto.block_type,
      scope: dto.scope || BlockScope.START,
      ref_entity_type: dto.ref_entity_type || null,
      ref_entity_id: dto.ref_entity_id || null,
      message: dto.message,
      is_active: true,
      created_by: userId,
    });

    return this.taskBlocksRepository.save(block);
  }

  /**
   * Get active blocks for a task
   */
  async getActiveBlocks(
    taskId: string,
    scope: BlockScope = BlockScope.START,
  ): Promise<TaskBlock[]> {
    return this.taskBlocksRepository.find({
      where: {
        task_id: taskId,
        scope,
        is_active: true,
      },
      order: {
        created_at: 'ASC',
      },
    });
  }

  /**
   * Disable a block (soft delete)
   */
  async disable(blockId: string): Promise<TaskBlock> {
    const block = await this.taskBlocksRepository.findOne({
      where: { id: blockId },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    block.is_active = false;
    return this.taskBlocksRepository.save(block);
  }

  /**
   * Disable blocks by reference entity
   */
  async disableByReference(
    refEntityType: EntityType,
    refEntityId: string,
  ): Promise<void> {
    await this.taskBlocksRepository.update(
      {
        ref_entity_type: refEntityType,
        ref_entity_id: refEntityId,
        is_active: true,
      },
      {
        is_active: false,
      },
    );
  }

  /**
   * Create or ensure block exists (upsert pattern)
   */
  async ensureBlock(
    taskId: string,
    blockType: BlockType,
    scope: BlockScope,
    refEntityType: EntityType | null,
    refEntityId: string | null,
    message: string,
    userId: string,
  ): Promise<TaskBlock> {
    // Check if block already exists and is active
    const existing = await this.taskBlocksRepository.findOne({
      where: {
        task_id: taskId,
        block_type: blockType,
        scope,
        ref_entity_type: refEntityType,
        ref_entity_id: refEntityId,
        is_active: true,
      },
    });

    if (existing) {
      return existing;
    }

    // Create new block
    return this.create(
      taskId,
      {
        block_type: blockType,
        scope,
        ref_entity_type: refEntityType,
        ref_entity_id: refEntityId,
        message,
      },
      userId,
    );
  }

  /**
   * Check if task has active blocks
   */
  async hasActiveBlocks(
    taskId: string,
    scope: BlockScope = BlockScope.START,
  ): Promise<boolean> {
    const count = await this.taskBlocksRepository.count({
      where: {
        task_id: taskId,
        scope,
        is_active: true,
      },
    });

    return count > 0;
  }

  /**
   * Delete a manual block (hard delete, only for MANUAL type)
   */
  async deleteManualBlock(blockId: string, userId: string): Promise<void> {
    const block = await this.taskBlocksRepository.findOne({
      where: { id: blockId },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    if (block.block_type !== BlockType.MANUAL) {
      throw new BadRequestException('Can only delete manual blocks');
    }

    await this.taskBlocksRepository.remove(block);
  }
}
