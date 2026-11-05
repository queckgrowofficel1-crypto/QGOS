import { Module } from '@nestjs/common';
import { BusinessPlanController } from './business-plan.controller';
import { BusinessPlanService } from './business-plan.service';

@Module({
  controllers: [BusinessPlanController],
  providers: [BusinessPlanService],
  exports: [BusinessPlanService],
})
export class BusinessPlanModule {}
