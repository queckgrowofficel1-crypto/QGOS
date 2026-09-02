import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NetworkService } from './network.service';

describe('NetworkService', () => {
  it('rejects self referral before database access', async () => {
    const prisma = {} as PrismaService;
    const service = new NetworkService(prisma);
    await expect(service.assignReferrer('user-1', 'user-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns direct downline ordered newest first', async () => {
    const findMany = jest.fn().mockResolvedValue([{ id: 'child-1' }]);
    const prisma = { user: { findMany } } as unknown as PrismaService;
    const service = new NetworkService(prisma);
    await expect(service.direct('root')).resolves.toEqual([{ id: 'child-1' }]);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { referrerId: 'root', deletedAt: null } }));
  });
});
