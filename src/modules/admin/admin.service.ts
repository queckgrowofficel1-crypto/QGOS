import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getOperationsSummary() {
    const [users, activeUsers, pendingUsers, wallets, investments, pendingInvestments, transactions, pendingTransactions, withdrawals, pendingWithdrawals, auditLogs] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { deletedAt: null, status: 'PENDING_VERIFICATION' } }),
      this.prisma.wallet.count({ where: { deletedAt: null } }),
      this.prisma.investment.count({ where: { deletedAt: null } }),
      this.prisma.investment.count({ where: { deletedAt: null, status: 'PENDING' } }),
      this.prisma.transaction.count({ where: { deletedAt: null } }),
      this.prisma.transaction.count({ where: { deletedAt: null, status: 'PENDING' } }),
      this.prisma.withdrawal.count({ where: { deletedAt: null } }),
      this.prisma.withdrawal.count({ where: { deletedAt: null, status: 'PENDING' } }),
      this.prisma.auditLog.count(),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      users: { total: users, active: activeUsers, pendingVerification: pendingUsers },
      financial: {
        wallets,
        investments,
        pendingInvestments,
        transactions,
        pendingTransactions,
        withdrawals,
        pendingWithdrawals,
      },
      audit: { records: auditLogs },
    };
  }
}
