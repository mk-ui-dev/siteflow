import { ApiProperty } from '@nestjs/swagger';
import { BlockType, BlockScope, EntityType } from '../entities/task-block.entity';

export class TaskBlockResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  task_id: string;

  @ApiProperty({ enum: BlockType })
  block_type: BlockType;

  @ApiProperty({ enum: BlockScope })
  scope: BlockScope;

  @ApiProperty({ enum: EntityType, nullable: true })
  ref_entity_type: EntityType | null;

  @ApiProperty({ nullable: true })
  ref_entity_id: string | null;

  @ApiProperty()
  message: string;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  created_by: string;
}
