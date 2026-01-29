import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Task } from '../../tasks/entities/task.entity';
import { User } from '../../users/entities/user.entity';

export enum BlockType {
  DELIVERY = 'DELIVERY',
  DECISION = 'DECISION',
  DEPENDENCY = 'DEPENDENCY',
  MANUAL = 'MANUAL',
}

export enum BlockScope {
  START = 'START',
  DONE = 'DONE',
}

export enum EntityType {
  TASK = 'TASK',
  INSPECTION = 'INSPECTION',
  ISSUE = 'ISSUE',
  DELIVERY = 'DELIVERY',
  DECISION = 'DECISION',
  LOCATION = 'LOCATION',
}

@Entity('task_blocks')
export class TaskBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  task_id: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({
    type: 'enum',
    enum: BlockType,
  })
  block_type: BlockType;

  @Column({
    type: 'enum',
    enum: BlockScope,
    default: BlockScope.START,
  })
  scope: BlockScope;

  @Column({
    type: 'enum',
    enum: EntityType,
    nullable: true,
  })
  ref_entity_type: EntityType | null;

  @Column('uuid', { nullable: true })
  ref_entity_id: string | null;

  @Column('text')
  message: string;

  @Column('boolean', { default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @Column('uuid')
  created_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;
}
