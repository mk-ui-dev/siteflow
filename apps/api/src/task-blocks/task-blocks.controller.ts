import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TaskBlocksService } from './task-blocks.service';
import { CreateTaskBlockDto } from './dto/create-task-block.dto';
import { TaskBlockResponseDto } from './dto/task-block-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectMemberGuard } from '../common/guards/project-member.guard';
import { ProjectRoles } from '../common/decorators/project-roles.decorator';
import { ProjectRole } from '../projects/entities/project-member.entity';
import { BlockScope } from './entities/task-block.entity';

@ApiTags('task-blocks')
@ApiBearerAuth()
@Controller('tasks/:taskId/blocks')
@UseGuards(JwtAuthGuard, ProjectMemberGuard)
export class TaskBlocksController {
  constructor(private readonly taskBlocksService: TaskBlocksService) {}

  @Post('manual')
  @ProjectRoles(ProjectRole.GC, ProjectRole.INSPECTOR)
  @ApiOperation({ summary: 'Create manual block (GC/Inspector only)' })
  @ApiResponse({ status: 201, type: TaskBlockResponseDto })
  async createManualBlock(
    @Param('taskId') taskId: string,
    @Body() createTaskBlockDto: CreateTaskBlockDto,
    @Request() req,
  ): Promise<TaskBlockResponseDto> {
    return this.taskBlocksService.create(
      taskId,
      createTaskBlockDto,
      req.user.id,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get active blocks for task' })
  @ApiQuery({ name: 'scope', enum: BlockScope, required: false })
  @ApiResponse({ status: 200, type: [TaskBlockResponseDto] })
  async getActiveBlocks(
    @Param('taskId') taskId: string,
    @Query('scope') scope?: BlockScope,
  ): Promise<TaskBlockResponseDto[]> {
    return this.taskBlocksService.getActiveBlocks(taskId, scope);
  }
}

@ApiTags('task-blocks')
@ApiBearerAuth()
@Controller('task-blocks')
@UseGuards(JwtAuthGuard, ProjectMemberGuard)
export class TaskBlockController {
  constructor(private readonly taskBlocksService: TaskBlocksService) {}

  @Delete(':id')
  @ProjectRoles(ProjectRole.GC, ProjectRole.INSPECTOR)
  @ApiOperation({ summary: 'Delete manual block (GC/Inspector only)' })
  @ApiResponse({ status: 204, description: 'Block deleted' })
  async deleteManualBlock(
    @Param('id') id: string,
    @Request() req,
  ): Promise<void> {
    await this.taskBlocksService.deleteManualBlock(id, req.user.id);
  }
}
