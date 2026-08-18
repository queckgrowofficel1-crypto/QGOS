import { Injectable, Logger } from '@nestjs/common';
import { AutomationExecutor } from './automation.executor';
import { AutomationService } from './automation.service';

@Injectable()
export class AutomationQueue {
  private readonly logger = new Logger(AutomationQueue.name);
  private running = false;
  private readonly pending: string[] = [];

  constructor(private readonly automation: AutomationService, private readonly executor: AutomationExecutor) {}

  enqueue(id: string): void {
    if (!this.pending.includes(id)) this.pending.push(id);
    void this.drain();
  }

  size(): number { return this.pending.length; }

  private async drain(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      while (this.pending.length) {
        const id = this.pending.shift()!;
        try {
          const definition = await this.automation.get(id);
          if (definition.status !== 'ACTIVE') continue;
          const result = await this.executor.execute(definition);
          if (result.status === 'FAILED') this.logger.error(`Automation ${id} failed: ${result.error}`);
        } catch (error) {
          this.logger.error(`Automation ${id} could not be loaded`, error instanceof Error ? error.stack : undefined);
        }
      }
    } finally {
      this.running = false;
    }
  }
}
