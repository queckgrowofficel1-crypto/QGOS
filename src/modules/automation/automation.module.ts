import { Module } from '@nestjs/common';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { AutomationStore } from './automation.store';
import { AutomationExecutor } from './automation.executor';

@Module({
  controllers: [AutomationController],
  providers: [AutomationService, AutomationStore, AutomationExecutor],
  exports: [AutomationService, AutomationExecutor],
})
export class AutomationModule {}
