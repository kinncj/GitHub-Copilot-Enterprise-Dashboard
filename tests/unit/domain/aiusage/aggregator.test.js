import { describe, it, expect } from 'vitest';
import { aggregateAIUsage } from '../../../../app/domain/aiusage/aggregator.js';

const rec = over => ({
  date: '2026-06-01', username: 'alice', product: 'copilot', sku: 'copilot_ai_credit',
  model: 'Claude Sonnet 4.6', baseModel: 'Claude Sonnet 4.6', isAuto: false,
  quantity: 10, unitType: 'ai-credits', costPerQuantity: 0.01, grossAmount: 0.1,
  discountAmount: 0.1, netAmount: 0, monthlyQuota: 3900, organization: 'Org-A',
  repository: '', costCenter: 'P&T', aicQuantity: 10, aicGrossAmount: 0.1, ...over
});

describe('aggregateAIUsage', () => {
  it('sums totals across records', () => {
    const a = aggregateAIUsage([rec(), rec({ quantity: 5, grossAmount: 0.05 })]);
    expect(a.totals.credits).toBeCloseTo(15);
    expect(a.totals.gross).toBeCloseTo(0.15);
    expect(a.totals.net).toBe(0);
  });

  it('rolls up per user with quota and day/model counts', () => {
    const a = aggregateAIUsage([
      rec({ date: '2026-06-01', model: 'GPT-5.4', baseModel: 'GPT-5.4' }),
      rec({ date: '2026-06-02', quantity: 20 }),
    ]);
    expect(a.byUser.alice.credits).toBeCloseTo(30);
    expect(a.byUser.alice.quota).toBe(3900);
    expect(a.byUser.alice.daysActive).toBe(2);
    expect(a.byUser.alice.modelCount).toBe(2);
  });

  it('counts active users per day and drops the Set', () => {
    const a = aggregateAIUsage([rec({ username: 'alice' }), rec({ username: 'bob' })]);
    expect(a.byDay['2026-06-01'].activeUsers).toBe(2);
    expect(a.byDay['2026-06-01'].users).toBeUndefined();
  });

  it('splits auto vs manual credits per base model', () => {
    const a = aggregateAIUsage([
      rec({ model: 'Auto: Claude Sonnet 4.6', baseModel: 'Claude Sonnet 4.6', isAuto: true, quantity: 7 }),
      rec({ model: 'Claude Sonnet 4.6', isAuto: false, quantity: 3 }),
    ]);
    expect(a.byModel['Claude Sonnet 4.6'].credits).toBeCloseTo(10);
    expect(a.byModel['Claude Sonnet 4.6'].auto).toBeCloseTo(7);
    expect(a.byModel['Claude Sonnet 4.6'].manual).toBeCloseTo(3);
  });

  it('groups by org, cost center, and sku with fallbacks', () => {
    const a = aggregateAIUsage([
      rec({ organization: '', costCenter: '', sku: 'coding_agent_ai_credit' }),
    ]);
    expect(a.byOrg.Unattributed.credits).toBeCloseTo(10);
    expect(a.byCostCenter.Unattributed.credits).toBeCloseTo(10);
    expect(a.bySku.coding_agent_ai_credit.credits).toBeCloseTo(10);
  });
});
