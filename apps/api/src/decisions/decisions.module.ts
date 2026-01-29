import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DecisionsController } from './decisions.controller';
import { DecisionsService } from './decisions.service';
import { Decision } from './entities/decision.entity';
import { DecisionOption } from './entities/decision-option.entity';
import { DecisionApproval } from './entities/decision-approval.entity';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { TaskBlocksModule } from '../task-blocks/task-blocks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Decision, DecisionOption, DecisionApproval]),
    ActivityLogsModule,
    TaskBlocksModule,
  ],
  controllers: [DecisionsController],
  providers: [DecisionsService],
  exports: [DecisionsService],
})
export class DecisionsModule {}
