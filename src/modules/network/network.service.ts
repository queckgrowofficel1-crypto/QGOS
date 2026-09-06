import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NetworkService {
  constructor(private readonly prisma: PrismaService) {}

  async assignReferrer(userId: string, referrerId: string) {
    if (userId === referrerId) throw new BadRequestException('A user cannot refer themselves');

    return this.prisma.$transaction(async (tx) => {
      const [user, referrer] = await Promise.all([
        tx.user.findUnique({ where: { id: userId }, select: { id: true, referrerId: true } }),
        tx.user.findUnique({ where: { id: referrerId }, select: { id: true } }),
      ]);
      if (!user) throw new NotFoundException('User not found');
      if (!referrer) throw new NotFoundException('Referrer not found');
      if (user.referrerId && user.referrerId !== referrerId) throw new BadRequestException('Referrer is already assigned');
      if (user.referrerId === referrerId) return { id: user.id, referrerId: user.referrerId, updatedAt: new Date() };

      let cursor: string | null = referrerId;
      const visited = new Set<string>();
      while (cursor) {
        if (cursor === userId) throw new BadRequestException('Referral cycle is not allowed');
        if (visited.has(cursor)) throw new BadRequestException('Existing referral cycle detected');
        visited.add(cursor);
        const node: { referrerId: string | null } | null = await tx.user.findUnique({
          where: { id: cursor },
          select: { referrerId: true },
        });
        cursor = node?.referrerId ?? null;
      }

      const assigned = await tx.user.updateMany({
        where: { id: userId, referrerId: null, deletedAt: null },
        data: { referrerId },
      });
      if (assigned.count !== 1) {
        const current = await tx.user.findUnique({ where: { id: userId }, select: { id: true, referrerId: true } });
        if (current?.referrerId === referrerId) return { id: current.id, referrerId: current.referrerId, updatedAt: new Date() };
        throw new BadRequestException('Referrer is already assigned');
      }
      return tx.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, referrerId: true, updatedAt: true } });
    }, { isolationLevel: 'Serializable' });
  }

  async assignReferralCode(userId: string, referralCode: string) {
    const referrer = await this.prisma.user.findFirst({ where: { referralCode, deletedAt: null }, select: { id: true } });
    if (!referrer) throw new NotFoundException('Referral code not found');
    return this.assignReferrer(userId, referrer.id);
  }

  direct(userId: string) {
    return this.prisma.user.findMany({
      where: { referrerId: userId, deletedAt: null },
      select: { id: true, fullName: true, username: true, email: true, referralCode: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async stats(userId: string, depth = 10) {
    const root = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!root) throw new NotFoundException('User not found');
    const levels: number[] = [];
    let frontier = [userId];
    const seen = new Set<string>(frontier);
    for (let level = 1; level <= Math.min(Math.max(depth, 1), 10) && frontier.length; level += 1) {
      const users = await this.prisma.user.findMany({ where: { referrerId: { in: frontier }, deletedAt: null }, select: { id: true } });
      frontier = users.map((user) => user.id).filter((id) => !seen.has(id));
      frontier.forEach((id) => seen.add(id));
      levels.push(frontier.length);
    }
    return { userId, directCount: levels[0] ?? 0, totalTeamCount: levels.reduce((sum, count) => sum + count, 0), levels };
  }

  async tree(userId: string, depth = 3) {
    const root = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, fullName: true, username: true, referralCode: true } });
    if (!root) throw new NotFoundException('User not found');
    return { ...root, referrals: await this.children(userId, Math.min(Math.max(depth, 1), 10), new Set([userId])) };
  }

  private async children(referrerId: string, depth: number, visited: Set<string>): Promise<unknown[]> {
    if (depth <= 0) return [];
    const users = await this.prisma.user.findMany({ where: { referrerId, deletedAt: null }, select: { id: true, fullName: true, username: true, referralCode: true }, orderBy: { createdAt: 'asc' } });
    return Promise.all(users.filter((user) => !visited.has(user.id)).map(async (user) => {
      const nextVisited = new Set(visited);
      nextVisited.add(user.id);
      return { ...user, referrals: await this.children(user.id, depth - 1, nextVisited) };
    }));
  }
}
