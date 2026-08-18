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
        const definition = this.automation.list().find((item) => item.id === id);
        if (!definition || definition.status !== 'ACTIVE') continue;
        const result = await this.executor.execute(definition);
        if (result.status === 'FAILED') this.logger.error(`Automation ${id} failed: ${result.error}`);
      }
    } finally {
      this.running = false;
    }
  }
}
