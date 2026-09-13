import { Module } from '@nestjs/common';
import { BusinessPlanService } from './business-plan.service';

@Module({
  providers: [BusinessPlanService],
  exports: [BusinessPlanService],
})
export class BusinessPlanModule {}
