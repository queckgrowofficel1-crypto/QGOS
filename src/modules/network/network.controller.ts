import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { AssignReferrerDto } from './network.dto';
import { NetworkService } from './network.service';

@Controller('network')
export class NetworkController {
  constructor(private readonly network: NetworkService) {}

  @Patch(':userId/referrer')
  assignReferrer(@Param('userId') userId: string, @Body() body: AssignReferrerDto) {
    return this.network.assignReferrer(userId, body.referrerId);
  }

  @Get(':userId/direct')
  direct(@Param('userId') userId: string) {
    return this.network.direct(userId);
  }

  @Get(':userId/tree')
  tree(@Param('userId') userId: string, @Query('depth') depth?: string) {
    return this.network.tree(userId, depth ? Number(depth) : 3);
  }
}
