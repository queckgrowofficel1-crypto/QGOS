import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';

@Module({
  imports: [PrismaModule],
  controllers: [AIController, WorkflowController, KnowledgeController],
  providers: [AIService, WorkflowService, KnowledgeService],
})
export class AIModule {}
