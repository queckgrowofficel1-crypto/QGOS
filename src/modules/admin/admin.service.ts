import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditLogAction, InvestmentStatus, Prisma, TransactionStatus, UserStatus, WithdrawalStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FinancialService } from '../financial/financial.service';
import { AdminAuditQueryDto, AdminWithdrawalDecisionDto, UpdateUserAdminDto } from './admin.dto';

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

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { status: input.status, role: input.role },
        select: { id: true, email: true, status: true, role: true, updatedAt: true },
      });

      await tx.auditLog.create({
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
    });
  }

  async approvalQueue() {
    const [withdrawals, investments, transactions] = await Promise.all([
      this.prisma.withdrawal.findMany({ where: { deletedAt: null, status: WithdrawalStatus.PENDING }, orderBy: { createdAt: 'asc' } }),
      this.prisma.investment.findMany({ where: { deletedAt: null, status: InvestmentStatus.PENDING }, orderBy: { createdAt: 'asc' } }),
      this.prisma.transaction.findMany({ where: { deletedAt: null, status: TransactionStatus.PENDING }, orderBy: { createdAt: 'asc' } }),
    ]);
    return { withdrawals, investments, transactions };
  }

  async auditLogs(input: AdminAuditQueryDto) {
    const page = input.page ?? 1;
    const limit = input.limit ?? 25;
    const where: Prisma.AuditLogWhereInput = {};
    if (input.entity) where.entity = input.entity;
    if (input.action) where.action = input.action;
    if (input.status) where.status = input.status;

    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          userId: true,
          action: true,
          entity: true,
          entityId: true,
          oldValues: true,
          newValues: true,
          changes: true,
          ipAddress: true,
          userAgent: true,
          status: true,
          errorMessage: true,
          createdAt: true,
          user: { select: { id: true, email: true, username: true } },
        },
      }),
    ]);
    return { page, limit, total, items };
  }

  async incomeMonitoring() {
    const [referral, pendingReferral, binary, pendingBinary, matching, pendingMatching, rankRewards, pendingRankRewards] = await Promise.all([
      this.prisma.referralIncome.aggregate({ where: { deletedAt: null }, _count: { _all: true }, _sum: { amount: true } }),
      this.prisma.referralIncome.aggregate({ where: { deletedAt: null, isProcessed: false }, _count: { _all: true }, _sum: { amount: true } }),
      this.prisma.binaryIncome.aggregate({ where: { deletedAt: null }, _count: { _all: true }, _sum: { pairBonus: true } }),
      this.prisma.binaryIncome.aggregate({ where: { deletedAt: null, isProcessed: false }, _count: { _all: true }, _sum: { pairBonus: true } }),
      this.prisma.matchingIncome.aggregate({ where: { deletedAt: null }, _count: { _all: true }, _sum: { amount: true } }),
      this.prisma.matchingIncome.aggregate({ where: { deletedAt: null, isProcessed: false }, _count: { _all: true }, _sum: { amount: true } }),
      this.prisma.rankReward.aggregate({ where: { deletedAt: null }, _count: { _all: true }, _sum: { amount: true } }),
      this.prisma.rankReward.aggregate({ where: { deletedAt: null, isProcessed: false }, _count: { _all: true }, _sum: { amount: true } }),
    ]);

    const summarize = (records: number, amount: Prisma.Decimal | null, pendingRecords: number, pendingAmount: Prisma.Decimal | null) => ({
      records,
      pendingRecords,
      amountTotal: amount?.toString() ?? '0',
      pendingAmount: pendingAmount?.toString() ?? '0',
    });

    return {
      generatedAt: new Date().toISOString(),
      referral: summarize(referral._count._all, referral._sum.amount, pendingReferral._count._all, pendingReferral._sum.amount),
      binary: summarize(binary._count._all, binary._sum.pairBonus, pendingBinary._count._all, pendingBinary._sum.pairBonus),
      matching: summarize(matching._count._all, matching._sum.amount, pendingMatching._count._all, pendingMatching._sum.amount),
      rankRewards: summarize(rankRewards._count._all, rankRewards._sum.amount, pendingRankRewards._count._all, pendingRankRewards._sum.amount),
    };
  }

  async networkSummary() {
    const [totalUsers, activeUsers, referredUsers, activeReferredUsers] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, status: UserStatus.ACTIVE } }),
      this.prisma.user.count({ where: { deletedAt: null, referrerId: { not: null } } }),
      this.prisma.user.count({ where: { deletedAt: null, status: UserStatus.ACTIVE, referrerId: { not: null } } }),
    ]);
    return {
      generatedAt: new Date().toISOString(),
      members: { total: totalUsers, active: activeUsers },
      network: {
        referredMembers: referredUsers,
        activeReferredMembers: activeReferredUsers,
        membersWithoutReferrer: totalUsers - referredUsers,
      },
    };
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
