import { describe, it, expect } from 'vitest';
import { mergeRecords } from '../../../../app/domain/data/merger.js';

function record(overrides = {}) {
  return {
    user_login: 'alice',
    day: '2025-01-01',
    code_generation_activity_count: 10,
    code_acceptance_activity_count: 5,
    loc_added_sum: 100,
    loc_deleted_sum: 20,
    active_time_minutes: 60,
    totals_by_ide: [{ ide: 'vscode' }],
    totals_by_feature: [],
    totals_by_language_feature: [],
    totals_by_language_model: [],
    totals_by_model_feature: [],
    model: 'gpt-4',
    ...overrides
  };
}

describe('mergeRecords', () => {
  it('returns same records when no duplicates', () => {
    const input = [
      record({ user_login: 'alice', day: '2025-01-01' }),
      record({ user_login: 'bob',   day: '2025-01-01' }),
      record({ user_login: 'alice', day: '2025-01-02' })
    ];
    const result = mergeRecords(input);
    expect(result).toHaveLength(3);
  });

  it('deduplicates on user_login + day', () => {
    const input = [
      record({ user_login: 'alice', day: '2025-01-01' }),
      record({ user_login: 'alice', day: '2025-01-01' })
    ];
    const result = mergeRecords(input);
    expect(result).toHaveLength(1);
  });

  it('takes Math.max for numeric fields', () => {
    const a = record({ code_generation_activity_count: 10, loc_added_sum: 100 });
    const b = record({ code_generation_activity_count: 15, loc_added_sum: 90  });
    const [merged] = mergeRecords([a, b]);
    expect(merged.code_generation_activity_count).toBe(15);
    expect(merged.loc_added_sum).toBe(100);
  });

  it('merges all numeric fields independently', () => {
    const a = record({ code_generation_activity_count: 5, code_acceptance_activity_count: 3, loc_added_sum: 50, loc_deleted_sum: 10, active_time_minutes: 30 });
    const b = record({ code_generation_activity_count: 8, code_acceptance_activity_count: 2, loc_added_sum: 40, loc_deleted_sum: 15, active_time_minutes: 45 });
    const [merged] = mergeRecords([a, b]);
    expect(merged.code_generation_activity_count).toBe(8);
    expect(merged.code_acceptance_activity_count).toBe(3);
    expect(merged.loc_added_sum).toBe(50);
    expect(merged.loc_deleted_sum).toBe(15);
    expect(merged.active_time_minutes).toBe(45);
  });

  it('keeps nested arrays from the first record', () => {
    const ide1 = [{ ide: 'vscode', code_generation_activity_count: 10 }];
    const ide2 = [{ ide: 'jetbrains', code_generation_activity_count: 5 }];
    const a = record({ totals_by_ide: ide1 });
    const b = record({ totals_by_ide: ide2 });
    const [merged] = mergeRecords([a, b]);
    expect(merged.totals_by_ide).toEqual(ide1);
  });

  it('handles missing numeric fields gracefully (treats as 0)', () => {
    const a = record({ code_generation_activity_count: undefined });
    const b = record({ code_generation_activity_count: 10 });
    const [merged] = mergeRecords([a, b]);
    expect(merged.code_generation_activity_count).toBe(10);
  });

  it('returns empty array for empty input', () => {
    expect(mergeRecords([])).toEqual([]);
  });

  it('does not mutate input records', () => {
    const a = record({ code_generation_activity_count: 10 });
    const b = record({ code_generation_activity_count: 20 });
    const origA = a.code_generation_activity_count;
    mergeRecords([a, b]);
    expect(a.code_generation_activity_count).toBe(origA);
  });
});
