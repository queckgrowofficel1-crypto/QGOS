import { Module } from '@nestjs/common';
import { AdminGuard } from '../admin/admin.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { FinancialController } from './financial.controller';
import { FinancialWriteGuard } from './financial-write.guard';
import { FinancialService } from './financial.service';
import { IncomeService } from './income.service';

@Module({
  imports: [PrismaModule],
  controllers: [FinancialController],
  providers: [FinancialService, IncomeService, AdminGuard, FinancialWriteGuard],
  exports: [FinancialService, IncomeService],
})
export class FinancialModule {}
