import { describe, it, expect } from 'vitest';
import { aggregateAIUsage } from '../../../../app/domain/aiusage/aggregator.js';
import { generateAIUsageInsights } from '../../../../app/domain/aiusage/insights.js';

const rec = over => ({
  date: '2026-06-01', username: 'alice', sku: 'copilot_ai_credit',
  model: 'Claude Sonnet 4.6', baseModel: 'Claude Sonnet 4.6', isAuto: false,
  quantity: 10, grossAmount: 0.1, discountAmount: 0.1, netAmount: 0, monthlyQuota: 100,
  organization: 'Org-A', costCenter: 'P&T', ...over
});

const titles = insights => insights.map(i => i.title);

describe('generateAIUsageInsights', () => {
  it('lists top spenders', () => {
    const recs = [rec({ username: 'alice', grossAmount: 1 }), rec({ username: 'bob', grossAmount: 5 })];
    const insights = generateAIUsageInsights(aggregateAIUsage(recs), recs);
    const top = insights.find(i => i.title === 'Top Spenders');
    expect(top.content).toMatch(/^bob/);
  });

  it('flags near-quota users at >=80%', () => {
    const recs = [rec({ username: 'heavy', quantity: 90, monthlyQuota: 100 })];
    const insights = generateAIUsageInsights(aggregateAIUsage(recs), recs);
    expect(titles(insights)).toContain('Near or Over Quota');
    expect(insights.find(i => i.title === 'Near or Over Quota').content).toMatch(/heavy/);
  });

  it('does not flag users below the quota threshold', () => {
    const recs = [rec({ username: 'light', quantity: 10, monthlyQuota: 100 })];
    const insights = generateAIUsageInsights(aggregateAIUsage(recs), recs);
    expect(titles(insights)).not.toContain('Near or Over Quota');
  });

  it('reports the most-used model and auto/explicit split', () => {
    const recs = [
      rec({ model: 'Auto: GPT-5.4', baseModel: 'GPT-5.4', isAuto: true, quantity: 30 }),
      rec({ model: 'Claude Sonnet 4.6', isAuto: false, quantity: 10 }),
    ];
    const insights = generateAIUsageInsights(aggregateAIUsage(recs), recs);
    expect(insights.find(i => i.title === 'Most-Used Model').content).toMatch(/GPT-5\.4/);
    expect(insights.find(i => i.title === 'Auto-Routed vs Explicit').content).toMatch(/75\.0% auto-routed/);
  });

  it('reports coding-agent share when present', () => {
    const recs = [
      rec({ sku: 'coding_agent_ai_credit', quantity: 25 }),
      rec({ sku: 'copilot_ai_credit', quantity: 75 }),
    ];
    const insights = generateAIUsageInsights(aggregateAIUsage(recs), recs);
    expect(insights.find(i => i.title === 'Coding-Agent Usage').content).toMatch(/25\.0%/);
  });
});
