import { Injectable, Logger } from '@nestjs/common';
import { AutomationExecutor, AutomationExecutionResult } from './automation.executor';
import { AutomationDefinition } from './automation.service';

@Injectable()
export class AutomationRetryService {
  private readonly logger = new Logger(AutomationRetryService.name);

  constructor(private readonly executor: AutomationExecutor) {}

  async executeWithRetry(definition: AutomationDefinition, maxAttempts = 3, delayMs = 250): Promise<AutomationExecutionResult> {
    let last: AutomationExecutionResult | undefined;
    for (let attempt = 1; attempt <= Math.max(1, maxAttempts); attempt++) {
      last = await this.executor.execute(definition);
      if (last.status === 'COMPLETED') return last;
      if (attempt < maxAttempts) await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
    this.logger.error(`Automation ${definition.id} exhausted ${maxAttempts} attempts`);
    return last!;
  }
}
