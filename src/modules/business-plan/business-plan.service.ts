import { Injectable } from '@nestjs/common';
import {
  QUECKGROW_RULE_VERSION,
  boosterRule,
  communityBuilderRule,
  ctoRule,
  dailyProfitRules,
  eligibleRanks,
  rankRules,
  tapToEarnRule,
  teamProfitRules,
  tokenReferralRule,
  validateWithdrawal,
  withdrawalRules,
} from './business-plan.rules';

@Injectable()
export class BusinessPlanService {
  readonly version = QUECKGROW_RULE_VERSION;

  getPlan() {
    return {
      version: this.version,
      tokenReferral: tokenReferralRule,
      tapToEarn: tapToEarnRule,
      dailyProfit: dailyProfitRules,
      communityBuilder: communityBuilderRule,
      teamProfit: teamProfitRules,
      booster: boosterRule,
      ranks: rankRules,
      cto: ctoRule,
      withdrawal: withdrawalRules,
    };
  }

  evaluateRank(input: Parameters<typeof eligibleRanks>[0]) {
    return eligibleRanks(input);
  }

  evaluateWithdrawal(input: Parameters<typeof validateWithdrawal>[0]) {
    return validateWithdrawal(input);
  }
}
