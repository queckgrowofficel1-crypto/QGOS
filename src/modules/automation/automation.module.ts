import { Module } from '@nestjs/common';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { AutomationStore } from './automation.store';

@Module({
  controllers: [AutomationController],
  providers: [AutomationService, AutomationStore],
  exports: [AutomationService],
})
export class AutomationModule {}
