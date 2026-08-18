import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        createdAt: true,
        wallet: { select: { balance: true } },
        referrals: { select: { id: true, name: true, email: true, createdAt: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
