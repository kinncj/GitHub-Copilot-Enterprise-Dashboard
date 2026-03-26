import { describe, it, expect } from 'vitest';
import { aggregateData } from '../../../../app/domain/data/aggregator.js';

function record(overrides = {}) {
  return {
    user_login: 'alice',
    day: '2025-01-01',
    code_generation_activity_count: 10,
    code_acceptance_activity_count: 5,
    loc_suggested_to_add_sum: 200,
    loc_added_sum: 100,
    loc_deleted_sum: 20,
    active_time_minutes: 60,
    totals_by_ide: [],
    totals_by_feature: [],
    totals_by_language_feature: [],
    totals_by_language_model: [],
    totals_by_model_feature: [],
    model: 'gpt-4',
    ...overrides
  };
}

describe('aggregateData', () => {
  it('returns empty dimensions for empty input', () => {
    const result = aggregateData([]);
    expect(result.byUser).toEqual({});
    expect(result.byDay).toEqual({});
    expect(result.byWeek).toEqual({});
    expect(result.byIDE).toEqual({});
    expect(result.byLanguage).toEqual({});
    expect(result.byFeature).toEqual({});
    expect(result.byModel).toEqual({});
  });

  describe('byUser', () => {
    it('aggregates single user', () => {
      const [r] = [record({ code_generation_activity_count: 20, loc_added_sum: 150, loc_suggested_to_add_sum: 300 })];
      const { byUser } = aggregateData([r]);
      expect(byUser['alice'].generations).toBe(20);
      expect(byUser['alice'].linesAdded).toBe(150);
      expect(byUser['alice'].locSuggested).toBe(300);
    });

    it('sums across multiple days for same user', () => {
      const records = [
        record({ day: '2025-01-01', code_generation_activity_count: 10 }),
        record({ day: '2025-01-02', code_generation_activity_count: 15 })
      ];
      const { byUser } = aggregateData(records);
      expect(byUser['alice'].generations).toBe(25);
    });

    it('tracks distinct active days', () => {
      const records = [
        record({ day: '2025-01-01' }),
        record({ day: '2025-01-02' }),
        record({ day: '2025-01-01' }) // duplicate day (shouldn't happen after merge, but let's be defensive)
      ];
      const { byUser } = aggregateData(records);
      expect(byUser['alice'].days.size).toBe(2);
    });

    it('tracks features used', () => {
      const r = record({
        totals_by_feature: [
          { feature: 'code_completion', code_generation_activity_count: 5 },
          { feature: 'agent', count: 3 }
        ]
      });
      const { byUser } = aggregateData([r]);
      expect(byUser['alice'].features.has('code_completion')).toBe(true);
      expect(byUser['alice'].features.has('agent')).toBe(true);
    });

    it('does not add features with zero counts', () => {
      const r = record({
        totals_by_feature: [
          { feature: 'zero_feature', code_generation_activity_count: 0, count: 0 }
        ]
      });
      const { byUser } = aggregateData([r]);
      expect(byUser['alice'].features.has('zero_feature')).toBe(false);
    });

    it('aggregates multiple users separately', () => {
      const records = [
        record({ user_login: 'alice', code_generation_activity_count: 10 }),
        record({ user_login: 'bob',   code_generation_activity_count: 20 })
      ];
      const { byUser } = aggregateData(records);
      expect(byUser['alice'].generations).toBe(10);
      expect(byUser['bob'].generations).toBe(20);
    });
  });

  describe('byDay', () => {
    it('aggregates across users on the same day', () => {
      const records = [
        record({ user_login: 'alice', day: '2025-01-01', code_generation_activity_count: 10 }),
        record({ user_login: 'bob',   day: '2025-01-01', code_generation_activity_count: 20 })
      ];
      const { byDay } = aggregateData(records);
      expect(byDay['2025-01-01'].generations).toBe(30);
    });

    it('counts unique active users per day', () => {
      const records = [
        record({ user_login: 'alice', day: '2025-01-01' }),
        record({ user_login: 'bob',   day: '2025-01-01' }),
        record({ user_login: 'alice', day: '2025-01-01' }) // duplicate
      ];
      const { byDay } = aggregateData(records);
      expect(byDay['2025-01-01'].activeUsers).toBe(2);
    });

    it('does not expose the internal users Set', () => {
      const { byDay } = aggregateData([record()]);
      expect(byDay['2025-01-01'].users).toBeUndefined();
    });

    it('counts chat interactions from feature totals', () => {
      const r = record({
        totals_by_feature: [{ feature: 'chat', count: 7 }]
      });
      const { byDay } = aggregateData([r]);
      expect(byDay['2025-01-01'].chatCount).toBe(7);
    });

    it('accumulates locSuggested in byDay', () => {
      const records = [
        record({ user_login: 'alice', day: '2025-01-01', loc_suggested_to_add_sum: 100 }),
        record({ user_login: 'bob',   day: '2025-01-01', loc_suggested_to_add_sum: 50 })
      ];
      const { byDay } = aggregateData(records);
      expect(byDay['2025-01-01'].locSuggested).toBe(150);
    });
  });

  describe('byIDE', () => {
    it('aggregates IDE breakdowns', () => {
      const r = record({
        totals_by_ide: [{ ide: 'vscode', code_generation_activity_count: 8, code_acceptance_activity_count: 4 }]
      });
      const { byIDE } = aggregateData([r]);
      expect(byIDE['vscode'].generations).toBe(8);
      expect(byIDE['vscode'].acceptances).toBe(4);
    });
  });

  describe('byFeature LoC', () => {
    it('accumulates loc_added_sum and loc_deleted_sum per feature', () => {
      const r = record({
        totals_by_feature: [
          { feature: 'agent_edit', code_generation_activity_count: 5, code_acceptance_activity_count: 0, loc_added_sum: 200, loc_deleted_sum: 40 },
          { feature: 'code_completion', code_generation_activity_count: 10, code_acceptance_activity_count: 7, loc_added_sum: 50, loc_deleted_sum: 0 }
        ]
      });
      const { byFeature } = aggregateData([r]);
      expect(byFeature['agent_edit'].linesAdded).toBe(200);
      expect(byFeature['agent_edit'].linesDeleted).toBe(40);
      expect(byFeature['code_completion'].linesAdded).toBe(50);
      expect(byFeature['code_completion'].linesDeleted).toBe(0);
    });
  });

  describe('byLanguage', () => {
    it('aggregates language breakdowns', () => {
      const r = record({
        totals_by_language_feature: [{ language: 'python', code_generation_activity_count: 12, code_acceptance_activity_count: 6 }]
      });
      const { byLanguage } = aggregateData([r]);
      expect(byLanguage['python'].generations).toBe(12);
      expect(byLanguage['python'].acceptances).toBe(6);
    });
  });

  describe('byModel', () => {
    it('aggregates model usage from language_model breakdown', () => {
      const r = record({
        totals_by_language_model: [
          { model: 'gpt-4', code_generation_activity_count: 10 },
          { model: 'claude', code_generation_activity_count: 5 }
        ]
      });
      const { byModel } = aggregateData([r]);
      expect(byModel['gpt-4']).toBe(10);
      expect(byModel['claude']).toBe(5);
    });

    it('defaults model to "unknown" when absent in language_model entry', () => {
      const r = record({
        totals_by_language_model: [{ code_generation_activity_count: 3 }]
      });
      const { byModel } = aggregateData([r]);
      expect(byModel['unknown']).toBe(3);
    });
  });

  describe('byUser usedAgent', () => {
    it('is false when used_agent is absent or false', () => {
      const { byUser } = aggregateData([record({ used_agent: false })]);
      expect(byUser['alice'].usedAgent).toBe(false);
    });

    it('is true when any record has used_agent=true', () => {
      const records = [
        record({ day: '2025-01-01', used_agent: false }),
        record({ day: '2025-01-02', used_agent: true })
      ];
      const { byUser } = aggregateData(records);
      expect(byUser['alice'].usedAgent).toBe(true);
    });

    it('counts agent adopters correctly across users', () => {
      const records = [
        record({ user_login: 'alice', used_agent: true }),
        record({ user_login: 'bob',   used_agent: false })
      ];
      const { byUser } = aggregateData(records);
      expect(byUser['alice'].usedAgent).toBe(true);
      expect(byUser['bob'].usedAgent).toBe(false);
    });
  });

  describe('byWeek', () => {
    it('groups days into the correct Monday week', () => {
      // 2025-01-06 is a Monday; 2025-01-07 is Tuesday (same week)
      const records = [
        record({ day: '2025-01-06' }),
        record({ day: '2025-01-07' })
      ];
      const { byWeek } = aggregateData(records);
      expect(byWeek['2025-01-06']).toBeDefined();
      expect(byWeek['2025-01-06'].activeUsers).toBe(1); // same user both days
    });

    it('puts Sunday into the preceding Monday week', () => {
      // 2025-01-05 is a Sunday → belongs to week starting 2024-12-30
      const { byWeek } = aggregateData([record({ day: '2025-01-05' })]);
      expect(byWeek['2024-12-30']).toBeDefined();
      expect(byWeek['2025-01-05']).toBeUndefined();
    });

    it('counts unique users per week', () => {
      const records = [
        record({ user_login: 'alice', day: '2025-01-06' }),
        record({ user_login: 'bob',   day: '2025-01-07' }),
        record({ user_login: 'alice', day: '2025-01-08' }) // duplicate user same week
      ];
      const { byWeek } = aggregateData(records);
      expect(byWeek['2025-01-06'].activeUsers).toBe(2);
    });

    it('does not expose the internal users Set', () => {
      const { byWeek } = aggregateData([record({ day: '2025-01-06' })]);
      expect(byWeek['2025-01-06'].users).toBeUndefined();
    });
  });
});
