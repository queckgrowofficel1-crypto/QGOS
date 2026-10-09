import { Body, Controller, Get, Post } from '@nestjs/common';
import { IsBoolean, IsInt, IsNumber, IsPositive, Min } from 'class-validator';
import { BusinessPlanService } from './business-plan.service';

class RankEvaluationDto {
  @IsNumber() @Min(0) selfIdUsd!: number;
  @IsInt() @Min(0) directUsers!: number;
  @IsNumber() @Min(0) teamBusinessUsd!: number;
}

class WithdrawalEvaluationDto {
  @IsNumber() @IsPositive() amountUsd!: number;
  @IsBoolean() isPrincipal!: boolean;
  @IsBoolean() isBeforeDuration!: boolean;
}

/**
 * Read-only evaluation endpoints. These calculate against the imported plan;
 * they never credit wallets, create transactions, approve withdrawals, or pay rewards.
 */
@Controller('business-plan')
export class BusinessPlanController {
  constructor(private readonly businessPlan: BusinessPlanService) {}

  @Get('rules')
  getRules() {
    return this.businessPlan.getPlan();
  }

  @Post('evaluate/rank')
  evaluateRank(@Body() body: RankEvaluationDto) {
    return {
      ruleVersion: this.businessPlan.version,
      eligibleRanks: this.businessPlan.evaluateRank(body),
      sideEffects: 'NONE',
    };
  }

  @Post('evaluate/withdrawal')
  evaluateWithdrawal(@Body() body: WithdrawalEvaluationDto) {
    return {
      ruleVersion: this.businessPlan.version,
      evaluation: this.businessPlan.evaluateWithdrawal(body),
      sideEffects: 'NONE',
      note: 'Evaluation only; this endpoint does not create or approve a withdrawal.',
    };
  }
}
