import { describe, it, expect } from 'vitest';
import { generateInsights } from '../../../../app/domain/insights/engine.js';

const defaultConfig = {
  POWER_USER_PERCENTILE: 0.90,
  MIN_GENERATIONS_FOR_RATE: 50,
  HIGH_ACCEPTANCE_THRESHOLD: 0.70,
  DAILY_GENERATION_QUOTA: 500,
  TREND_COMPARISON_DAYS: 7
};

function makeAggregated({ byUser = {}, byDay = {} } = {}) {
  return { byUser, byDay, byIDE: {}, byLanguage: {}, byFeature: {}, byModel: {} };
}

function userEntry({ generations = 100, acceptances = 50, linesAdded = 0, linesDeleted = 0, activeTime = 0 } = {}) {
  return { generations, acceptances, linesAdded, linesDeleted, activeTime, days: new Set(['2025-01-01']), features: new Set() };
}

describe('generateInsights', () => {
  it('returns empty array when no data', () => {
    const result = generateInsights(makeAggregated(), [], defaultConfig);
    expect(result).toEqual([]);
  });

  describe('Power Users', () => {
    it('generates a Power Users insight when users exist', () => {
      const byUser = {
        alice: userEntry({ generations: 1000 }),
        bob:   userEntry({ generations: 200 })
      };
      const insights = generateInsights(makeAggregated({ byUser }), [], defaultConfig);
      const power = insights.find(i => i.title === 'Power Users');
      expect(power).toBeDefined();
      expect(power.type).toBe('success');
      expect(power.icon).toBe('star');
    });

    it('limits Power Users to 5', () => {
      const byUser = {};
      for (let i = 0; i < 20; i++) {
        byUser[`user${i}`] = userEntry({ generations: (20 - i) * 100 });
      }
      const insights = generateInsights(makeAggregated({ byUser }), [], defaultConfig);
      const power = insights.find(i => i.title === 'Power Users');
      const names = power.content.split(', ');
      expect(names.length).toBeLessThanOrEqual(5);
    });
  });

  describe('High Efficiency Users', () => {
    it('generates insight for users with acceptance rate ≥70% and ≥50 generations', () => {
      const byUser = {
        efficient: userEntry({ generations: 100, acceptances: 75 })
      };
      const insights = generateInsights(makeAggregated({ byUser }), [], defaultConfig);
      const efficiency = insights.find(i => i.title === 'High Efficiency Users');
      expect(efficiency).toBeDefined();
    });

    it('excludes users below MIN_GENERATIONS_FOR_RATE', () => {
      const byUser = {
        lowVol: userEntry({ generations: 10, acceptances: 9 })  // 90% but only 10 gens
      };
      const insights = generateInsights(makeAggregated({ byUser }), [], defaultConfig);
      const efficiency = insights.find(i => i.title === 'High Efficiency Users');
      expect(efficiency).toBeUndefined();
    });

    it('excludes users below HIGH_ACCEPTANCE_THRESHOLD', () => {
      const byUser = {
        average: userEntry({ generations: 100, acceptances: 50 }) // 50% rate
      };
      const insights = generateInsights(makeAggregated({ byUser }), [], defaultConfig);
      const efficiency = insights.find(i => i.title === 'High Efficiency Users');
      expect(efficiency).toBeUndefined();
    });
  });

  describe('Daily Quota Exceeded', () => {
    it('flags records that exceed the daily generation quota', () => {
      const record = {
        user_login: 'alice',
        day: '2025-01-01',
        code_generation_activity_count: 600,
        code_acceptance_activity_count: 0
      };
      const insights = generateInsights(makeAggregated(), [record], defaultConfig);
      const quota = insights.find(i => i.title === 'Daily Quota Exceeded');
      expect(quota).toBeDefined();
      expect(quota.type).toBe('error');
    });

    it('does not flag records at or below quota', () => {
      const record = {
        user_login: 'alice',
        day: '2025-01-01',
        code_generation_activity_count: 500,
        code_acceptance_activity_count: 0
      };
      const insights = generateInsights(makeAggregated(), [record], defaultConfig);
      const quota = insights.find(i => i.title === 'Daily Quota Exceeded');
      expect(quota).toBeUndefined();
    });
  });

  describe('Week-over-Week Trend', () => {
    it('generates a trend insight when at least 14 days of data exist', () => {
      const byDay = {};
      for (let i = 0; i < 14; i++) {
        const d = new Date('2025-01-01');
        d.setDate(d.getDate() + i);
        byDay[d.toISOString().split('T')[0]] = { generations: 100, acceptances: 0, linesAdded: 0, linesDeleted: 0, chatCount: 0, activeUsers: 1 };
      }
      const insights = generateInsights(makeAggregated({ byDay }), [], defaultConfig);
      const trend = insights.find(i => i.title === 'Week-over-Week Trend');
      expect(trend).toBeDefined();
    });

    it('shows positive trend type for increasing activity', () => {
      const byDay = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date('2025-01-01');
        d.setDate(d.getDate() + i);
        byDay[d.toISOString().split('T')[0]] = { generations: 50 };
      }
      for (let i = 7; i < 14; i++) {
        const d = new Date('2025-01-01');
        d.setDate(d.getDate() + i);
        byDay[d.toISOString().split('T')[0]] = { generations: 100 };  // double
      }
      const insights = generateInsights(makeAggregated({ byDay }), [], defaultConfig);
      const trend = insights.find(i => i.title === 'Week-over-Week Trend');
      expect(trend.type).toBe('success');
      expect(trend.content).toContain('+');
    });

    it('does not generate trend with fewer than 14 days', () => {
      const byDay = {};
      for (let i = 0; i < 13; i++) {
        const d = new Date('2025-01-01');
        d.setDate(d.getDate() + i);
        byDay[d.toISOString().split('T')[0]] = { generations: 100 };
      }
      const insights = generateInsights(makeAggregated({ byDay }), [], defaultConfig);
      const trend = insights.find(i => i.title === 'Week-over-Week Trend');
      expect(trend).toBeUndefined();
    });
  });

  describe('Zero Acceptance Days', () => {
    it('flags records with generations but zero acceptances', () => {
      const records = [
        { user_login: 'alice', day: '2025-01-01', code_generation_activity_count: 10, code_acceptance_activity_count: 0 }
      ];
      const insights = generateInsights(makeAggregated(), records, defaultConfig);
      const zero = insights.find(i => i.title === 'Zero Acceptance Days');
      expect(zero).toBeDefined();
      expect(zero.type).toBe('warning');
    });

    it('does not flag records with zero generations', () => {
      const records = [
        { user_login: 'alice', day: '2025-01-01', code_generation_activity_count: 0, code_acceptance_activity_count: 0 }
      ];
      const insights = generateInsights(makeAggregated(), records, defaultConfig);
      const zero = insights.find(i => i.title === 'Zero Acceptance Days');
      expect(zero).toBeUndefined();
    });
  });

  it('respects custom config thresholds', () => {
    const customConfig = { ...defaultConfig, DAILY_GENERATION_QUOTA: 5 };
    const record = { user_login: 'alice', day: '2025-01-01', code_generation_activity_count: 10, code_acceptance_activity_count: 0 };
    const insights = generateInsights(makeAggregated(), [record], customConfig);
    const quota = insights.find(i => i.title === 'Daily Quota Exceeded');
    expect(quota).toBeDefined();
  });
});
