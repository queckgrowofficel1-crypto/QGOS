import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditLogAction, Prisma, TransactionStatus, UserRole, UserStatus, WithdrawalStatus, InvestmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FinancialService } from '../financial/financial.service';
import { AdminWithdrawalDecisionDto, UpdateUserAdminDto } from './admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financial: FinancialService,
  ) {}

  async getOperationsSummary() {
    const [users, activeUsers, pendingUsers, wallets, investments, pendingInvestments, transactions, pendingTransactions, withdrawals, pendingWithdrawals, auditLogs] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, status: UserStatus.ACTIVE } }),
      this.prisma.user.count({ where: { deletedAt: null, status: UserStatus.PENDING_VERIFICATION } }),
      this.prisma.wallet.count({ where: { deletedAt: null } }),
      this.prisma.investment.count({ where: { deletedAt: null } }),
      this.prisma.investment.count({ where: { deletedAt: null, status: InvestmentStatus.PENDING } }),
      this.prisma.transaction.count({ where: { deletedAt: null } }),
      this.prisma.transaction.count({ where: { deletedAt: null, status: TransactionStatus.PENDING } }),
      this.prisma.withdrawal.count({ where: { deletedAt: null } }),
      this.prisma.withdrawal.count({ where: { deletedAt: null, status: WithdrawalStatus.PENDING } }),
      this.prisma.auditLog.count(),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      users: { total: users, active: activeUsers, pendingVerification: pendingUsers },
      financial: { wallets, investments, pendingInvestments, transactions, pendingTransactions, withdrawals, pendingWithdrawals },
      audit: { records: auditLogs },
      alerts: {
        pendingApprovals: pendingWithdrawals + pendingInvestments,
        pendingTransactions,
        pendingVerifications: pendingUsers,
      },
    };
  }

  users() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true, email: true, username: true, fullName: true, status: true, role: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUser(userId: string, input: UpdateUserAdminDto) {
    const current = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null }, select: { id: true, status: true, role: true } });
    if (!current) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: input.status, role: input.role },
      select: { id: true, email: true, status: true, role: true, updatedAt: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: input.actorId,
        action: AuditLogAction.UPDATE,
        entity: 'User',
        entityId: userId,
        oldValues: { status: current.status, role: current.role } as Prisma.InputJsonObject,
        newValues: { status: updated.status, role: updated.role } as Prisma.InputJsonObject,
        changes: input.note ?? 'Administrative user update',
      },
    });
    return updated;
  }

  async approvalQueue() {
    const [withdrawals, investments, transactions] = await Promise.all([
      this.prisma.withdrawal.findMany({ where: { deletedAt: null, status: WithdrawalStatus.PENDING }, orderBy: { createdAt: 'asc' } }),
      this.prisma.investment.findMany({ where: { deletedAt: null, status: InvestmentStatus.PENDING }, orderBy: { createdAt: 'asc' } }),
      this.prisma.transaction.findMany({ where: { deletedAt: null, status: TransactionStatus.PENDING }, orderBy: { createdAt: 'asc' } }),
    ]);
    return { withdrawals, investments, transactions };
  }

  async approveWithdrawal(id: string, input: AdminWithdrawalDecisionDto) {
    const result = await this.financial.approveWithdrawal(id, { approvedBy: input.actorId, note: input.note });
    await this.auditWithdrawal(input.actorId, id, 'Withdrawal approved');
    return result;
  }

  async rejectWithdrawal(id: string, input: AdminWithdrawalDecisionDto) {
    const result = await this.financial.rejectWithdrawal(id, { approvedBy: input.actorId, note: input.note });
    await this.auditWithdrawal(input.actorId, id, input.note ?? 'Withdrawal rejected');
    return result;
  }

  async completeWithdrawal(id: string, actorId: string) {
    const result = await this.financial.completeWithdrawal(id);
    await this.auditWithdrawal(actorId, id, 'Withdrawal completed');
    return result;
  }

  private auditWithdrawal(actorId: string, id: string, changes: string) {
    return this.prisma.auditLog.create({
      data: { userId: actorId, action: AuditLogAction.UPDATE, entity: 'Withdrawal', entityId: id, changes },
    });
  }
}
