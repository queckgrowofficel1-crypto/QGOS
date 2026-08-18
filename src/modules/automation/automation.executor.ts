import { Injectable, Logger } from '@nestjs/common';
import { AutomationDefinition } from './automation.service';

export interface AutomationExecutionResult {
  automationId: string;
  status: 'COMPLETED' | 'FAILED';
  startedAt: string;
  completedAt: string;
  executedActions: string[];
  error?: string;
}

@Injectable()
export class AutomationExecutor {
  private readonly logger = new Logger(AutomationExecutor.name);

  async execute(definition: AutomationDefinition): Promise<AutomationExecutionResult> {
    const startedAt = new Date().toISOString();
    try {
      if (definition.status !== 'ACTIVE') {
        throw new Error('Automation must be ACTIVE before execution');
      }
      for (const action of definition.actions) {
        this.logger.log(`Executing automation action: ${action}`);
      }
      return {
        automationId: definition.id,
        status: 'COMPLETED',
        startedAt,
        completedAt: new Date().toISOString(),
        executedActions: definition.actions,
      };
    } catch (error) {
      return {
        automationId: definition.id,
        status: 'FAILED',
        startedAt,
        completedAt: new Date().toISOString(),
        executedActions: [],
        error: error instanceof Error ? error.message : 'Unknown execution error',
      };
    }
  }
}
