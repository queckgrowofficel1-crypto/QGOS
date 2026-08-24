import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FinancialController } from './financial.controller';
import { FinancialService } from './financial.service';
import { IncomeService } from './income.service';

@Module({
  imports: [PrismaModule],
  controllers: [FinancialController],
  providers: [FinancialService, IncomeService],
  exports: [FinancialService, IncomeService],
})
export class FinancialModule {}
