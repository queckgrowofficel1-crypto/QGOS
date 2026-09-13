import {
  eligibleRanks,
  getDailyProfitPercent,
  getTeamProfitPercent,
  qualifiesBooster,
  qualifiesCommunityBuilder,
  validateWithdrawal,
} from './business-plan.rules';

describe('QueckGrow business-plan rules', () => {
  it('resolves daily-profit rates from the supplied plan', () => {
    expect(getDailyProfitPercent(null)).toBe(0.35);
    expect(getDailyProfitPercent(30)).toBe(0.65);
    expect(getDailyProfitPercent(720)).toBe(2);
  });

  it('resolves team-profit levels 1 through 5', () => {
    expect([1, 2, 3, 4, 5].map(getTeamProfitPercent)).toEqual([5, 4, 3, 2, 1]);
  });

  it('checks community-builder qualification', () => {
    expect(qualifiesCommunityBuilder({ directReferrals: 10, referralsSameOrHigherPackage: 10, daysFromActivation: 10 })).toBe(true);
    expect(qualifiesCommunityBuilder({ directReferrals: 10, referralsSameOrHigherPackage: 9, daysFromActivation: 10 })).toBe(false);
    expect(qualifiesCommunityBuilder({ directReferrals: 10, referralsSameOrHigherPackage: 10, daysFromActivation: 11 })).toBe(false);
  });

  it('checks booster qualification', () => {
    expect(qualifiesBooster({ directSameOrHigherPackage: 3, days: 7, directBusinessUsd: 750 })).toBe(true);
    expect(qualifiesBooster({ directSameOrHigherPackage: 2, days: 7, directBusinessUsd: 750 })).toBe(false);
  });

  it('evaluates rank thresholds without inventing the unspecified Diamond team target', () => {
    expect(eligibleRanks({ selfIdUsd: 750, directUsers: 12, teamBusinessUsd: 50_000 })).toEqual(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']);
    expect(eligibleRanks({ selfIdUsd: 1_000, directUsers: 15, teamBusinessUsd: 50_000 })).toContain('DIAMOND');
  });

  it('validates withdrawal minimum and multiple rules', () => {
    expect(validateWithdrawal({ amountUsd: 10, isPrincipal: false, isBeforeDuration: false }).valid).toBe(true);
    expect(validateWithdrawal({ amountUsd: 15, isPrincipal: false, isBeforeDuration: false }).valid).toBe(false);
    expect(validateWithdrawal({ amountUsd: 5, isPrincipal: false, isBeforeDuration: false }).valid).toBe(false);
    expect(validateWithdrawal({ amountUsd: 100, isPrincipal: true, isBeforeDuration: true }).reason).toContain('20%');
    expect(validateWithdrawal({ amountUsd: 100, isPrincipal: true, isBeforeDuration: false }).reason).toContain('10%');
  });
});
