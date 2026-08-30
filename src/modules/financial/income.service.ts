import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TransactionStatus, TransactionType, WalletType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DistributeReferralIncomeDto } from './financial.dto';

const DEFAULT_LEVEL_PERCENTAGES = [5, 4, 3, 2, 1];

@Injectable()
export class IncomeService {
  constructor(private readonly prisma: PrismaService) {}

  async history(userId: string) {
    const [referral, binary, matching, rank] = await Promise.all([
      this.prisma.referralIncome.findMany({ where: { userId, deletedAt: null }, orderBy: { createdAt: 'desc' } }),
      this.prisma.binaryIncome.findMany({ where: { userId, deletedAt: null }, orderBy: { createdAt: 'desc' } }),
      this.prisma.matchingIncome.findMany({ where: { userId, deletedAt: null }, orderBy: { createdAt: 'desc' } }),
      this.prisma.rankReward.findMany({ where: { userId, deletedAt: null }, orderBy: { createdAt: 'desc' } }),
    ]);
    return { referral, binary, matching, rank };
  }

  async distributeReferralIncome(input: DistributeReferralIncomeDto) {
    const baseAmount = new Prisma.Decimal(input.baseAmount);
    if (!baseAmount.isFinite() || baseAmount.lte(0)) throw new BadRequestException('Base amount must be greater than zero');
    const sourceUser = await this.prisma.user.findFirst({ where: { id: input.sourceUserId, deletedAt: null } });
    if (!sourceUser) throw new NotFoundException('Source user not found');

    const maxLevels = Math.min(input.maxLevels ?? DEFAULT_LEVEL_PERCENTAGES.length, DEFAULT_LEVEL_PERCENTAGES.length);
    const results: Array<{ userId: string; level: number; percentage: number; amount: Prisma.Decimal }> = [];

    return this.prisma.$transaction(async (tx) => {
      let currentReferrerId = sourceUser.referrerId;
      for (let level = 1; level <= maxLevels && currentReferrerId; level += 1) {
        const recipient = await tx.user.findFirst({ where: { id: currentReferrerId, deletedAt: null } });
        if (!recipient) break;
        if (recipient.id === sourceUser.id) throw new BadRequestException('Referral cycle detected');

        const percentage = DEFAULT_LEVEL_PERCENTAGES[level - 1];
        const amount = baseAmount.mul(percentage).div(100);
        const reference = `${input.reference}:L${level}`;
        const existing = await tx.transaction.findUnique({ where: { reference } });

        if (!existing) {
          const wallet = await tx.wallet.upsert({
            where: { userId_type: { userId: recipient.id, type: WalletType.PRIMARY } },
            create: { userId: recipient.id, type: WalletType.PRIMARY, currency: input.currency ?? 'USD' },
            update: {},
          });
          const now = new Date();
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: amount }, totalEarned: { increment: amount }, lastTransactionAt: now },
          });
          await tx.referralIncome.create({
            data: { userId: recipient.id, referralUserId: sourceUser.id, amount, percentage: new Prisma.Decimal(percentage), level, isProcessed: true, processedAt: now, description: `Level ${level} referral income` },
          });
          await tx.transaction.create({
            data: {
              userId: recipient.id,
              walletId: wallet.id,
              type: TransactionType.INCOME,
              status: TransactionStatus.COMPLETED,
              amount,
              fee: new Prisma.Decimal(0),
              netAmount: amount,
              currency: input.currency ?? wallet.currency,
              reference,
              description: `Level ${level} referral income from ${sourceUser.id}`,
              metadata: { sourceUserId: sourceUser.id, level, percentage, incomeType: 'REFERRAL' } as Prisma.InputJsonObject,
              processedAt: now,
            },
          });
        }

        results.push({ userId: recipient.id, level, percentage, amount });
        currentReferrerId = recipient.referrerId;
      }
      return results;
    });
  }
}
