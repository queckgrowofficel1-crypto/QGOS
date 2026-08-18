import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';

@Module({
  imports: [PrismaModule],
  controllers: [AIController, WorkflowController],
  providers: [AIService, WorkflowService],
})
export class AIModule {}
