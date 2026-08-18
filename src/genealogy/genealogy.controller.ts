import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('genealogy')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('genealogy')
export class GenealogyController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async tree(@Req() req: { user: { sub: string } }) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.sub },
      select: {
        id: true,
        name: true,
        referralCode: true,
        referrals: { select: { id: true, name: true, email: true, referralCode: true, createdAt: true } },
      },
    });
    return user ?? { id: req.user.sub, referrals: [] };
  }
}
