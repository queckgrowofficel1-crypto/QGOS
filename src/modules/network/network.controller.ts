import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { AssignReferralCodeDto, AssignReferrerDto } from './network.dto';
import { NetworkService } from './network.service';

@Controller('network')
export class NetworkController {
  constructor(private readonly network: NetworkService) {}

  @Patch(':userId/referrer')
  assignReferrer(@Param('userId') userId: string, @Body() body: AssignReferrerDto) { return this.network.assignReferrer(userId, body.referrerId); }

  @Patch(':userId/referral-code')
  assignReferralCode(@Param('userId') userId: string, @Body() body: AssignReferralCodeDto) { return this.network.assignReferralCode(userId, body.referralCode); }

  @Get(':userId/direct')
  direct(@Param('userId') userId: string) { return this.network.direct(userId); }

  @Get(':userId/stats')
  stats(@Param('userId') userId: string, @Query('depth') depth?: string) { return this.network.stats(userId, depth ? Number(depth) : 10); }

  @Get(':userId/tree')
  tree(@Param('userId') userId: string, @Query('depth') depth?: string) { return this.network.tree(userId, depth ? Number(depth) : 3); }
}
