import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { WalletType } from '@prisma/client';
import { CreateInvestmentDto, CreateWithdrawalDto, DistributeReferralIncomeDto, WalletOperationDto, WithdrawalDecisionDto } from './financial.dto';
import { FinancialService } from './financial.service';
import { FinancialWriteGuard } from './financial-write.guard';
import { IncomeService } from './income.service';

@Controller('financial')
export class FinancialController {
  constructor(
    private readonly financial: FinancialService,
    private readonly income: IncomeService,
  ) {}

  @Get('wallets/:userId/:type') wallet(@Param('userId') userId: string, @Param('type') type: WalletType) { return this.financial.getWallet(userId, type); }
  @Get('wallets/:userId/:type/history') history(@Param('userId') userId: string, @Param('type') type: WalletType) { return this.financial.history(userId, type); }
  @UseGuards(FinancialWriteGuard)
  @Post('ledger/credit') credit(@Body() body: WalletOperationDto) { return this.financial.credit(body); }
  @UseGuards(FinancialWriteGuard)
  @Post('ledger/debit') debit(@Body() body: WalletOperationDto) { return this.financial.debit(body); }
  @UseGuards(FinancialWriteGuard)
  @Post('investments') createInvestment(@Body() body: CreateInvestmentDto) { return this.financial.createInvestment(body); }
  @Get('investments/:userId') investments(@Param('userId') userId: string) { return this.financial.investments(userId); }

  @UseGuards(FinancialWriteGuard)
  @Post('withdrawals') createWithdrawal(@Body() body: CreateWithdrawalDto) { return this.financial.createWithdrawal(body); }
  @Get('withdrawals/:userId') withdrawals(@Param('userId') userId: string) { return this.financial.withdrawals(userId); }
  @UseGuards(FinancialWriteGuard)
  @Post('withdrawals/:id/approve') approveWithdrawal(@Param('id') id: string, @Body() body: WithdrawalDecisionDto) { return this.financial.approveWithdrawal(id, body); }
  @UseGuards(FinancialWriteGuard)
  @Post('withdrawals/:id/reject') rejectWithdrawal(@Param('id') id: string, @Body() body: WithdrawalDecisionDto) { return this.financial.rejectWithdrawal(id, body); }
  @UseGuards(FinancialWriteGuard)
  @Post('withdrawals/:id/complete') completeWithdrawal(@Param('id') id: string) { return this.financial.completeWithdrawal(id); }

  @Get('income/:userId/history') incomeHistory(@Param('userId') userId: string) { return this.income.history(userId); }
  @UseGuards(FinancialWriteGuard)
  @Post('income/referral/distribute') distributeReferralIncome(@Body() body: DistributeReferralIncomeDto) { return this.income.distributeReferralIncome(body); }
}
