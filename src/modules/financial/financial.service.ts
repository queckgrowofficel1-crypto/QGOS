import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TransactionType, TransactionStatus, WalletType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletOperationDto } from './financial.dto';

@Injectable()
export class FinancialService {
  constructor(private readonly prisma: PrismaService) {}

  async getWallet(userId: string, type: WalletType) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId_type: { userId, type } } });
    if (!wallet || wallet.deletedAt || !wallet.isActive) throw new NotFoundException('Active wallet not found');
    return wallet;
  }

  async history(userId: string, type: WalletType) {
    const wallet = await this.getWallet(userId, type);
    return this.prisma.transaction.findMany({
      where: { walletId: wallet.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async credit(input: WalletOperationDto) {
    return this.apply(input, 'CREDIT');
  }

  async debit(input: WalletOperationDto) {
    return this.apply(input, 'DEBIT');
  }

  private async apply(input: WalletOperationDto, direction: 'CREDIT' | 'DEBIT') {
    const amount = new Prisma.Decimal(input.amount);
    if (!amount.isFinite() || amount.lte(0)) throw new BadRequestException('Amount must be greater than zero');

    const existing = await this.prisma.transaction.findUnique({ where: { reference: input.reference } });
    if (existing) return existing;

    return this.prisma.$transaction(async (tx) => {
      const duplicate = await tx.transaction.findUnique({ where: { reference: input.reference } });
      if (duplicate) return duplicate;

      const user = await tx.user.findFirst({ where: { id: input.userId, deletedAt: null } });
      if (!user) throw new NotFoundException('User not found');

      const wallet = await tx.wallet.upsert({
        where: { userId_type: { userId: input.userId, type: input.type } },
        create: { userId: input.userId, type: input.type, currency: input.currency ?? 'USD' },
        update: {},
      });
      if (!wallet.isActive || wallet.deletedAt) throw new BadRequestException('Wallet is not active');
      if (direction === 'DEBIT' && wallet.balance.lt(amount)) throw new BadRequestException('Insufficient wallet balance');

      const totalUpdate = direction === 'CREDIT'
        ? { totalDeposited: { increment: amount } }
        : input.transactionType === TransactionType.WITHDRAWAL
          ? { totalWithdrawn: { increment: amount } }
          : {};

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: direction === 'CREDIT' ? { increment: amount } : { decrement: amount },
          lastTransactionAt: new Date(),
          ...totalUpdate,
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId: input.userId,
          walletId: updatedWallet.id,
          type: input.transactionType,
          status: TransactionStatus.COMPLETED,
          amount,
          fee: new Prisma.Decimal(0),
          netAmount: amount,
          currency: input.currency ?? updatedWallet.currency,
          description: input.description,
          reference: input.reference,
          processedAt: new Date(),
        },
      });

      return transaction;
    });
  }
}
