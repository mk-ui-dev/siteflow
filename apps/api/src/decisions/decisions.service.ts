import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Decision, DecisionStatus } from './entities/decision.entity';
import { DecisionOption } from './entities/decision-option.entity';
import { DecisionApproval } from './entities/decision-approval.entity';
import { CreateDecisionDto } from './dto/create-decision.dto';
import { UpdateDecisionDto } from './dto/update-decision.dto';
import { CastApprovalDto } from './dto/cast-approval.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { TaskBlocksService } from '../task-blocks/task-blocks.service';
import { BlockType, BlockScope, EntityType } from '../task-blocks/entities/task-block.entity';

@Injectable()
export class DecisionsService {
  constructor(
    @InjectRepository(Decision)
    private decisionsRepository: Repository<Decision>,
    @InjectRepository(DecisionOption)
    private decisionOptionsRepository: Repository<DecisionOption>,
    @InjectRepository(DecisionApproval)
    private decisionApprovalsRepository: Repository<DecisionApproval>,
    private activityLogsService: ActivityLogsService,
    private taskBlocksService: TaskBlocksService,
  ) {}

  async create(
    projectId: string,
    dto: CreateDecisionDto,
    userId: string,
  ): Promise<Decision> {
    const decision = this.decisionsRepository.create({
      project_id: projectId,
      subject: dto.subject,
      problem: dto.problem,
      related_type: dto.related_type,
      related_id: dto.related_id,
      blocks_work: dto.blocks_work || false,
      decision_owner_id: dto.decision_owner_id,
      due_date: dto.due_date,
      status: DecisionStatus.DRAFT,
      created_by: userId,
      updated_by: userId,
    });

    const savedDecision = await this.decisionsRepository.save(decision);

    // Create options
    if (dto.options && dto.options.length > 0) {
      const options = dto.options.map((opt) =>
        this.decisionOptionsRepository.create({
          decision_id: savedDecision.id,
          option_text: opt.option_text,
        }),
      );
      await this.decisionOptionsRepository.save(options);
    }

    // Create approvals
    if (dto.approver_ids && dto.approver_ids.length > 0) {
      const approvals = dto.approver_ids.map((approverId) =>
        this.decisionApprovalsRepository.create({
          decision_id: savedDecision.id,
          approver_id: approverId,
        }),
      );
      await this.decisionApprovalsRepository.save(approvals);
    }

    await this.activityLogsService.log({
      project_id: projectId,
      entity_type: 'DECISION',
      entity_id: savedDecision.id,
      action: 'CREATED',
      user_id: userId,
      details: { subject: dto.subject },
    });

    return savedDecision;
  }

  async findAll(projectId: string): Promise<Decision[]> {
    return this.decisionsRepository.find({
      where: { project_id: projectId },
      relations: ['options', 'approvals', 'approvals.approver'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Decision> {
    const decision = await this.decisionsRepository.findOne({
      where: { id },
      relations: [
        'options',
        'approvals',
        'approvals.approver',
        'decision_owner',
        'project',
      ],
    });

    if (!decision) {
      throw new NotFoundException('Decision not found');
    }

    return decision;
  }

  /**
   * INV-9: Submit for approval and create task block if blocks_work=true
   */
  async submitForApproval(id: string, userId: string): Promise<Decision> {
    const decision = await this.findOne(id);

    // Validation
    if (!decision.decision_owner_id) {
      throw new BadRequestException('Decision owner is required');
    }

    if (!decision.due_date) {
      throw new BadRequestException('Due date is required');
    }

    const approvals = await this.decisionApprovalsRepository.find({
      where: { decision_id: id },
    });

    if (approvals.length === 0) {
      throw new BadRequestException('At least one approver is required');
    }

    const previousStatus = decision.status;
    decision.status = DecisionStatus.PENDING_APPROVAL;
    decision.updated_by = userId;

    const updated = await this.decisionsRepository.save(decision);

    // INV-9: Create task block if blocks_work=true and related_type=TASK
    if (decision.blocks_work && decision.related_type === 'TASK') {
      await this.taskBlocksService.ensureBlock(
        decision.related_id,
        BlockType.DECISION,
        BlockScope.START,
        EntityType.DECISION,
        id,
        `Waiting for decision: ${decision.subject}`,
        userId,
      );

      await this.activityLogsService.log({
        project_id: decision.project_id,
        entity_type: 'TASK',
        entity_id: decision.related_id,
        action: 'BLOCKED',
        user_id: userId,
        details: {
          block_type: 'DECISION',
          decision_id: id,
          subject: decision.subject,
        },
      });
    }

    await this.activityLogsService.log({
      project_id: decision.project_id,
      entity_type: 'DECISION',
      entity_id: id,
      action: 'SUBMITTED',
      user_id: userId,
      details: {},
    });

    return updated;
  }

  /**
   * Cast approval/rejection and auto-approve/reject decision
   */
  async castApproval(
    id: string,
    approverId: string,
    dto: CastApprovalDto,
    userId: string,
  ): Promise<Decision> {
    const decision = await this.findOne(id);

    // Find approval record
    const approval = await this.decisionApprovalsRepository.findOne({
      where: { decision_id: id, approver_id: approverId },
    });

    if (!approval) {
      throw new NotFoundException('Approval not found for this approver');
    }

    // Update approval
    approval.approved = dto.approved;
    approval.comment = dto.comment;
    approval.decided_at = new Date();
    await this.decisionApprovalsRepository.save(approval);

    await this.activityLogsService.log({
      project_id: decision.project_id,
      entity_type: 'DECISION',
      entity_id: id,
      action: 'APPROVAL_CAST',
      user_id: userId,
      details: {
        approver_id: approverId,
        approved: dto.approved,
        comment: dto.comment,
      },
    });

    // Recompute decision status
    return this.recomputeDecisionStatus(decision, userId);
  }

  /**
   * Recompute decision status based on approvals
   */
  private async recomputeDecisionStatus(
    decision: Decision,
    userId: string,
  ): Promise<Decision> {
    const approvals = await this.decisionApprovalsRepository.find({
      where: { decision_id: decision.id },
    });

    const allApproved = approvals.every((a) => a.approved === true);
    const anyRejected = approvals.some((a) => a.approved === false);
    const previousStatus = decision.status;

    if (anyRejected) {
      decision.status = DecisionStatus.REJECTED;
      decision.updated_by = userId;
      await this.decisionsRepository.save(decision);

      // INV-9: Disable task block when rejected (decision is made)
      if (decision.blocks_work && decision.related_type === 'TASK') {
        await this.taskBlocksService.disableByReference(
          EntityType.DECISION,
          decision.id,
        );

        await this.activityLogsService.log({
          project_id: decision.project_id,
          entity_type: 'TASK',
          entity_id: decision.related_id,
          action: 'UNBLOCKED',
          user_id: userId,
          details: {
            block_type: 'DECISION',
            decision_id: decision.id,
            reason: 'Decision rejected',
          },
        });
      }

      await this.activityLogsService.log({
        project_id: decision.project_id,
        entity_type: 'DECISION',
        entity_id: decision.id,
        action: 'REJECTED',
        user_id: userId,
        details: {},
      });
    } else if (allApproved) {
      decision.status = DecisionStatus.APPROVED;
      decision.updated_by = userId;
      await this.decisionsRepository.save(decision);

      // INV-9: Disable task block when approved
      if (decision.blocks_work && decision.related_type === 'TASK') {
        await this.taskBlocksService.disableByReference(
          EntityType.DECISION,
          decision.id,
        );

        await this.activityLogsService.log({
          project_id: decision.project_id,
          entity_type: 'TASK',
          entity_id: decision.related_id,
          action: 'UNBLOCKED',
          user_id: userId,
          details: {
            block_type: 'DECISION',
            decision_id: decision.id,
            reason: 'Decision approved',
          },
        });
      }

      await this.activityLogsService.log({
        project_id: decision.project_id,
        entity_type: 'DECISION',
        entity_id: decision.id,
        action: 'APPROVED',
        user_id: userId,
        details: {},
      });
    }

    return decision;
  }

  async delete(id: string, userId: string): Promise<void> {
    const decision = await this.findOne(id);

    // Disable any related task blocks
    if (decision.blocks_work && decision.related_type === 'TASK') {
      await this.taskBlocksService.disableByReference(EntityType.DECISION, id);
    }

    await this.activityLogsService.log({
      project_id: decision.project_id,
      entity_type: 'DECISION',
      entity_id: id,
      action: 'DELETED',
      user_id: userId,
      details: { subject: decision.subject },
    });

    await this.decisionsRepository.remove(decision);
  }
}
