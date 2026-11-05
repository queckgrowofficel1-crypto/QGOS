import { BusinessPlanController } from './business-plan.controller';
import { BusinessPlanService } from './business-plan.service';

describe('BusinessPlanController', () => {
  let controller: BusinessPlanController;

  beforeEach(() => {
    controller = new BusinessPlanController(new BusinessPlanService());
  });

  it('exposes the versioned source-plan rules without mutation', () => {
    const result = controller.getRules();
    expect(result.version).toBe('source-pdf-v1');
    expect(result.teamProfit).toHaveLength(5);
  });

  it('evaluates rank eligibility without enabling payouts', () => {
    expect(controller.evaluateRank({ selfIdUsd: 100, directUsers: 3, teamBusinessUsd: 750 })).toEqual({
      ruleVersion: 'source-pdf-v1',
      eligibleRanks: ['BRONZE'],
      sideEffects: 'NONE',
    });
  });

  it('labels withdrawal evaluation as read-only', () => {
    const result = controller.evaluateWithdrawal({ amountUsd: 15, isPrincipal: false, isBeforeDuration: false });
    expect(result.evaluation.valid).toBe(false);
    expect(result.sideEffects).toBe('NONE');
    expect(result.note).toContain('does not create or approve');
  });
});
