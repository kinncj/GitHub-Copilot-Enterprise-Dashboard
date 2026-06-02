import { describe, it, expect } from 'vitest';
import { filterAIUsage, extractAIUsageFilterOptions } from '../../../../app/domain/aiusage/filtering.js';

const rec = over => ({
  date: '2026-06-01', username: 'alice', sku: 'copilot_ai_credit',
  model: 'Claude Sonnet 4.6', baseModel: 'Claude Sonnet 4.6', isAuto: false,
  quantity: 10, grossAmount: 0.1, netAmount: 0, monthlyQuota: 3900,
  organization: 'Org-A', costCenter: 'P&T', ...over
});

const data = [
  rec(),
  rec({ username: 'bob', date: '2026-06-02', baseModel: 'GPT-5.4', model: 'Auto: GPT-5.4', isAuto: true, organization: 'Org-B', costCenter: 'EdPower' }),
];

describe('filterAIUsage', () => {
  it('filters by date range (inclusive)', () => {
    expect(filterAIUsage(data, { dateFrom: '2026-06-02', dateTo: null })).toHaveLength(1);
    expect(filterAIUsage(data, { dateTo: '2026-06-01' })).toHaveLength(1);
  });
  it('filters by user', () => {
    expect(filterAIUsage(data, { user: 'alice' })).toHaveLength(1);
  });
  it('matches model on base name even when auto-routed', () => {
    expect(filterAIUsage(data, { model: 'GPT-5.4' })).toHaveLength(1);
  });
  it('filters by org and cost center', () => {
    expect(filterAIUsage(data, { org: 'Org-B' })[0].username).toBe('bob');
    expect(filterAIUsage(data, { costCenter: 'P&T' })[0].username).toBe('alice');
  });
  it('returns all when criteria are empty', () => {
    expect(filterAIUsage(data, {})).toHaveLength(2);
  });
});

describe('extractAIUsageFilterOptions', () => {
  it('returns sorted unique dimension values', () => {
    const opts = extractAIUsageFilterOptions(data);
    expect(opts.users).toEqual(['alice', 'bob']);
    expect(opts.models).toEqual(['Claude Sonnet 4.6', 'GPT-5.4']);
    expect(opts.orgs).toEqual(['Org-A', 'Org-B']);
    expect(opts.costCenters).toEqual(['EdPower', 'P&T']);
  });
});
