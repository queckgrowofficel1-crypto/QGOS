import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { WalletType } from '@prisma/client';
import { WalletOperationDto } from './financial.dto';
import { FinancialService } from './financial.service';

@Controller('financial')
export class FinancialController {
  constructor(private readonly financial: FinancialService) {}

  @Get('wallets/:userId/:type')
  wallet(@Param('userId') userId: string, @Param('type') type: WalletType) {
    return this.financial.getWallet(userId, type);
  }

  @Get('wallets/:userId/:type/history')
  history(@Param('userId') userId: string, @Param('type') type: WalletType) {
    return this.financial.history(userId, type);
  }

  @Post('ledger/credit')
  credit(@Body() body: WalletOperationDto) {
    return this.financial.credit(body);
  }

  @Post('ledger/debit')
  debit(@Body() body: WalletOperationDto) {
    return this.financial.debit(body);
  }
}
