import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { AutomationExecutor } from './automation.executor';
import { AutomationService } from './automation.service';

@Injectable()
export class AutomationScheduler implements OnModuleDestroy {
  private readonly logger = new Logger(AutomationScheduler.name);
  private readonly timers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly automation: AutomationService,
    private readonly executor: AutomationExecutor,
  ) {}

  schedule(id: string, delayMs: number): void {
    this.cancel(id);
    const timer = setTimeout(async () => {
      const definition = this.automation.list().find((item) => item.id === id);
      if (!definition || definition.status !== 'ACTIVE') return;
      await this.executor.execute(definition);
      this.timers.delete(id);
    }, Math.max(0, delayMs));
    this.timers.set(id, timer);
  }

  cancel(id: string): void {
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer);
    this.timers.delete(id);
  }

  onModuleDestroy(): void {
    for (const id of this.timers.keys()) this.cancel(id);
  }
}
