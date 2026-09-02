import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminWithdrawalDecisionDto, UpdateUserAdminDto } from './admin.dto';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('summary')
  summary() { return this.admin.getOperationsSummary(); }

  @Get('users')
  users() { return this.admin.users(); }

  @Patch('users/:userId')
  updateUser(@Param('userId') userId: string, @Body() body: UpdateUserAdminDto) {
    return this.admin.updateUser(userId, body);
  }

  @Get('approvals')
  approvals() { return this.admin.approvalQueue(); }

  @Post('withdrawals/:id/approve')
  approveWithdrawal(@Param('id') id: string, @Body() body: AdminWithdrawalDecisionDto) {
    return this.admin.approveWithdrawal(id, body);
  }

  @Post('withdrawals/:id/reject')
  rejectWithdrawal(@Param('id') id: string, @Body() body: AdminWithdrawalDecisionDto) {
    return this.admin.rejectWithdrawal(id, body);
  }

  @Post('withdrawals/:id/complete')
  completeWithdrawal(@Param('id') id: string, @Body() body: AdminWithdrawalDecisionDto) {
    return this.admin.completeWithdrawal(id, body.actorId);
  }
}
