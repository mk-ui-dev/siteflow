import { IsEnum, IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BlockType, BlockScope, EntityType } from '../entities/task-block.entity';

export class CreateTaskBlockDto {
  @ApiProperty({ enum: BlockType })
  @IsEnum(BlockType)
  block_type: BlockType;

  @ApiProperty({ enum: BlockScope, default: BlockScope.START })
  @IsEnum(BlockScope)
  @IsOptional()
  scope?: BlockScope;

  @ApiPropertyOptional({ enum: EntityType })
  @IsEnum(EntityType)
  @IsOptional()
  ref_entity_type?: EntityType;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  ref_entity_id?: string;

  @ApiProperty()
  @IsString()
  message: string;
}
