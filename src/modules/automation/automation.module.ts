import { Module } from '@nestjs/common';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { AutomationStore } from './automation.store';
import { AutomationExecutor } from './automation.executor';
import { AutomationScheduler } from './automation.scheduler';
import { AutomationQueue } from './automation.queue';
import { AutomationRetryService } from './automation.retry';

@Module({
  controllers: [AutomationController],
  providers: [AutomationService, AutomationStore, AutomationExecutor, AutomationScheduler, AutomationQueue, AutomationRetryService],
  exports: [AutomationService, AutomationExecutor, AutomationScheduler, AutomationQueue, AutomationRetryService],
})
export class AutomationModule {}
