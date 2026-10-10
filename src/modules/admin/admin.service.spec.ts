import { AuditLogAction, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FinancialService } from '../financial/financial.service';
import { AdminService } from './admin.service';

describe('AdminService observability', () => {
  const prisma = {
    auditLog: { count: jest.fn(), findMany: jest.fn() },
    referralIncome: { aggregate: jest.fn() },
    binaryIncome: { aggregate: jest.fn() },
    matchingIncome: { aggregate: jest.fn() },
    rankReward: { aggregate: jest.fn() },
    user: { count: jest.fn() },
  } as unknown as PrismaService;

  let service: AdminService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminService(prisma, {} as FinancialService);
  });

  it('returns paginated audit events with filters and newest-first ordering', async () => {
    (prisma.auditLog.count as jest.Mock).mockResolvedValue(1);
    (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([{ id: 'log-1' }]);

    const result = await service.auditLogs({ page: 2, limit: 10, entity: 'Withdrawal', action: AuditLogAction.UPDATE, status: 'SUCCESS' });

    expect(prisma.auditLog.count).toHaveBeenCalledWith({ where: { entity: 'Withdrawal', action: AuditLogAction.UPDATE, status: 'SUCCESS' } });
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 10,
      take: 10,
      orderBy: { createdAt: 'desc' },
      where: { entity: 'Withdrawal', action: AuditLogAction.UPDATE, status: 'SUCCESS' },
    }));
    expect(result).toEqual({ page: 2, limit: 10, total: 1, items: [{ id: 'log-1' }] });
  });

  it('summarizes income queues without mutating balances or income records', async () => {
    const aggregate = (count: number, amount: string) => ({ _count: { _all: count }, _sum: { amount: { toString: () => amount }, pairBonus: { toString: () => amount } } });
    (prisma.referralIncome.aggregate as jest.Mock).mockResolvedValueOnce(aggregate(5, '100')).mockResolvedValueOnce(aggregate(2, '30'));
    (prisma.binaryIncome.aggregate as jest.Mock).mockResolvedValueOnce(aggregate(4, '80')).mockResolvedValueOnce(aggregate(1, '20'));
    (prisma.matchingIncome.aggregate as jest.Mock).mockResolvedValueOnce(aggregate(3, '60')).mockResolvedValueOnce(aggregate(1, '10'));
    (prisma.rankReward.aggregate as jest.Mock).mockResolvedValueOnce(aggregate(2, '40')).mockResolvedValueOnce(aggregate(0, '0'));

    const result = await service.incomeMonitoring();

    expect(result.referral).toEqual({ records: 5, pendingRecords: 2, amountTotal: '100', pendingAmount: '30' });
    expect(result.binary).toEqual({ records: 4, pendingRecords: 1, amountTotal: '80', pendingAmount: '20' });
    expect(result.matching).toEqual({ records: 3, pendingRecords: 1, amountTotal: '60', pendingAmount: '10' });
    expect(result.rankRewards).toEqual({ records: 2, pendingRecords: 0, amountTotal: '40', pendingAmount: '0' });
    expect(prisma.referralIncome.aggregate).toHaveBeenCalledTimes(2);
  });

  it('reports referral network totals using active, non-deleted members only', async () => {
    (prisma.user.count as jest.Mock)
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(9)
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(5);

    const result = await service.networkSummary();

    expect(prisma.user.count).toHaveBeenNthCalledWith(1, { where: { deletedAt: null } });
    expect(prisma.user.count).toHaveBeenNthCalledWith(2, { where: { deletedAt: null, status: UserStatus.ACTIVE } });
    expect(result.members).toEqual({ total: 12, active: 9 });
    expect(result.network).toEqual({ referredMembers: 7, activeReferredMembers: 5, membersWithoutReferrer: 5 });
  });
});
