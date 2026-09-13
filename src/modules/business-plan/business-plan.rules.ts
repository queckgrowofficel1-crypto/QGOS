export const QUECKGROW_RULE_VERSION = 'source-pdf-v1';

export const tokenReferralRule = {
  sponsorTokens: 500,
  referredUserTokens: 250,
  level2Tokens: 50,
  totalSupply: 100_000_000,
  burning: true,
} as const;

export const tapToEarnRule = {
  activeUserTokens: 150,
  inactiveUserTokens: 100,
  settlementWindowHours: 12,
} as const;

export const dailyProfitRules = [
  { durationDays: null, incomePercent: 0.35 },
  { durationDays: 30, incomePercent: 0.65 },
  { durationDays: 90, incomePercent: 0.8 },
  { durationDays: 180, incomePercent: 0.95 },
  { durationDays: 365, incomePercent: 1.15 },
  { durationDays: 720, incomePercent: 2.0 },
] as const;

export const teamProfitRules = [
  { level: 1, incomePercent: 5 },
  { level: 2, incomePercent: 4 },
  { level: 3, incomePercent: 3 },
  { level: 4, incomePercent: 2 },
  { level: 5, incomePercent: 1 },
] as const;

export const communityBuilderRule = {
  directReferralCount: 10,
  withinDaysFromActivation: 10,
  minimumPackageRelation: 'SAME_OR_HIGHER',
  rewardIncomePercent: 5,
} as const;

export const boosterRule = {
  directReferralCount: 3,
  withinDays: 7,
  minimumPackageRelation: 'SAME_OR_HIGHER',
  directBusinessUsd: 750,
  extraRoiPercent: 0.2,
} as const;

export const rankRules = [
  { rank: 'BRONZE', selfIdUsd: 100, directUsers: 3, teamBusinessUsd: 750, teamRewardUsd: 50 },
  { rank: 'SILVER', selfIdUsd: 250, directUsers: 5, teamBusinessUsd: 3_000, teamRewardUsd: 200 },
  { rank: 'GOLD', selfIdUsd: 500, directUsers: 8, teamBusinessUsd: 10_000, teamRewardUsd: 800 },
  { rank: 'PLATINUM', selfIdUsd: 750, directUsers: 12, teamBusinessUsd: 50_000, teamRewardUsd: 7_500 },
  { rank: 'DIAMOND', selfIdUsd: 1_000, directUsers: 15, teamBusinessUsd: null, teamRewardUsd: null },
] as const;

export const ctoRule = {
  platinumLegCount: 3,
  differentLegsRequired: 3,
  monthlyCtoPercent: 10,
  firstUsersLimit: 50,
  qualifyingPlatinumCount: 2,
  qualifyingDifferentLegs: 2,
} as const;

export const withdrawalRules = {
  incomeCapMultiple: 4,
  principalBeforeDurationChargePercent: 20,
  principalAfterDurationChargePercent: 10,
  principalAfterDurationAdminPercent: 5,
  principalAfterDurationServicePercent: 5,
  minimumUsd: 10,
  withdrawalChargePercent: 10,
  multipleUsd: 10,
  tokensUsedAtWithdrawal: true,
} as const;

export type PackageRelation = 'SAME_OR_HIGHER' | 'LOWER' | 'UNKNOWN';

export interface CommunityBuilderInput {
  directReferrals: number;
  referralsSameOrHigherPackage: number;
  daysFromActivation: number;
}

export interface BoosterInput {
  directSameOrHigherPackage: number;
  days: number;
  directBusinessUsd: number;
}

export interface RankInput {
  selfIdUsd: number;
  directUsers: number;
  teamBusinessUsd: number;
}

export interface WithdrawalInput {
  amountUsd: number;
  isPrincipal: boolean;
  isBeforeDuration: boolean;
}

export function qualifiesCommunityBuilder(input: CommunityBuilderInput): boolean {
  return input.directReferrals >= communityBuilderRule.directReferralCount
    && input.referralsSameOrHigherPackage >= communityBuilderRule.directReferralCount
    && input.daysFromActivation <= communityBuilderRule.withinDaysFromActivation;
}

export function qualifiesBooster(input: BoosterInput): boolean {
  return input.directSameOrHigherPackage >= boosterRule.directReferralCount
    && input.days <= boosterRule.withinDays
    && input.directBusinessUsd >= boosterRule.directBusinessUsd;
}

export function eligibleRanks(input: RankInput): string[] {
  return rankRules
    .filter((rule) => input.selfIdUsd >= rule.selfIdUsd
      && input.directUsers >= rule.directUsers
      && (rule.teamBusinessUsd === null || input.teamBusinessUsd >= rule.teamBusinessUsd))
    .map((rule) => rule.rank);
}

export function validateWithdrawal(input: WithdrawalInput): { valid: boolean; reason?: string } {
  if (!Number.isFinite(input.amountUsd) || input.amountUsd <= 0) return { valid: false, reason: 'Amount must be greater than zero' };
  if (input.amountUsd < withdrawalRules.minimumUsd) return { valid: false, reason: 'Below minimum withdrawal amount' };
  if (input.amountUsd % withdrawalRules.multipleUsd !== 0) return { valid: false, reason: 'Withdrawal must be a multiple of the configured amount' };
  if (input.isPrincipal && input.isBeforeDuration) return { valid: true, reason: 'Principal-before-duration charge: 20%' };
  if (input.isPrincipal) return { valid: true, reason: 'Principal-after-duration charge: 10% (5% admin + 5% service)' };
  return { valid: true };
}

export function getDailyProfitPercent(durationDays: number | null): number | undefined {
  return dailyProfitRules.find((rule) => rule.durationDays === durationDays)?.incomePercent;
}

export function getTeamProfitPercent(level: number): number | undefined {
  return teamProfitRules.find((rule) => rule.level === level)?.incomePercent;
}
