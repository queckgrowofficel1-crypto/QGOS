import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NetworkService {
  constructor(private readonly prisma: PrismaService) {}

  async assignReferrer(userId: string, referrerId: string) {
    if (userId === referrerId) {
      throw new BadRequestException('A user cannot refer themselves');
    }

    const [user, referrer] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, referrerId: true } }),
      this.prisma.user.findUnique({ where: { id: referrerId }, select: { id: true } }),
    ]);

    if (!user) throw new NotFoundException('User not found');
    if (!referrer) throw new NotFoundException('Referrer not found');
    if (user.referrerId && user.referrerId !== referrerId) {
      throw new BadRequestException('Referrer is already assigned');
    }

    let cursor: string | null = referrerId;
    const visited = new Set<string>();
    while (cursor) {
      if (cursor === userId) {
        throw new BadRequestException('Referral cycle is not allowed');
      }
      if (visited.has(cursor)) {
        throw new BadRequestException('Existing referral cycle detected');
      }
      visited.add(cursor);
      const node = await this.prisma.user.findUnique({
        where: { id: cursor },
        select: { referrerId: true },
      });
      cursor = node?.referrerId ?? null;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { referrerId },
      select: { id: true, referrerId: true, updatedAt: true },
    });
  }

  direct(userId: string) {
    return this.prisma.user.findMany({
      where: { referrerId: userId, deletedAt: null },
      select: { id: true, fullName: true, username: true, email: true, referralCode: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async tree(userId: string, depth = 3) {
    const root = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, username: true, referralCode: true },
    });
    if (!root) throw new NotFoundException('User not found');
    return { ...root, referrals: await this.children(userId, Math.min(Math.max(depth, 1), 10)) };
  }

  private async children(referrerId: string, depth: number): Promise<unknown[]> {
    if (depth <= 0) return [];
    const users = await this.prisma.user.findMany({
      where: { referrerId, deletedAt: null },
      select: { id: true, fullName: true, username: true, referralCode: true },
      orderBy: { createdAt: 'asc' },
    });
    return Promise.all(users.map(async (user) => ({
      ...user,
      referrals: await this.children(user.id, depth - 1),
    })));
  }
}
