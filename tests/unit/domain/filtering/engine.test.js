import { describe, it, expect } from 'vitest';
import { filterRecords, quickRangeDates, extractFilterOptions } from '../../../../app/domain/filtering/engine.js';

function record(overrides = {}) {
  return {
    user_login: 'alice',
    day: '2025-06-15',
    code_generation_activity_count: 10,
    code_acceptance_activity_count: 5,
    loc_added_sum: 100,
    loc_deleted_sum: 20,
    active_time_minutes: 60,
    totals_by_ide: [{ ide: 'vscode' }],
    totals_by_feature: [],
    totals_by_language_feature: [{ language: 'python', feature: 'code_completion' }],
    totals_by_language_model: [],
    totals_by_model_feature: [],
    model: 'gpt-4',
    ...overrides
  };
}

describe('filterRecords', () => {
  it('returns all records when criteria is empty', () => {
    const records = [record(), record({ user_login: 'bob', day: '2025-06-16' })];
    const result = filterRecords(records, {});
    expect(result).toHaveLength(2);
  });

  describe('date filter', () => {
    it('excludes records before dateFrom', () => {
      const records = [
        record({ day: '2025-06-10' }),
        record({ day: '2025-06-15' }),
        record({ day: '2025-06-20' })
      ];
      const result = filterRecords(records, { dateFrom: '2025-06-15' });
      expect(result).toHaveLength(2);
      expect(result.every(r => r.day >= '2025-06-15')).toBe(true);
    });

    it('excludes records after dateTo', () => {
      const records = [
        record({ day: '2025-06-10' }),
        record({ day: '2025-06-15' }),
        record({ day: '2025-06-20' })
      ];
      const result = filterRecords(records, { dateTo: '2025-06-15' });
      expect(result).toHaveLength(2);
      expect(result.every(r => r.day <= '2025-06-15')).toBe(true);
    });

    it('includes records within the date range', () => {
      const records = [
        record({ day: '2025-06-01' }),
        record({ day: '2025-06-15' }),
        record({ day: '2025-06-30' })
      ];
      const result = filterRecords(records, { dateFrom: '2025-06-10', dateTo: '2025-06-20' });
      expect(result).toHaveLength(1);
      expect(result[0].day).toBe('2025-06-15');
    });
  });

  describe('user filter', () => {
    it('keeps only records for the specified user', () => {
      const records = [
        record({ user_login: 'alice' }),
        record({ user_login: 'bob' }),
        record({ user_login: 'alice' })
      ];
      const result = filterRecords(records, { user: 'alice' });
      expect(result).toHaveLength(2);
      expect(result.every(r => r.user_login === 'alice')).toBe(true);
    });

    it('returns no records when user does not match any', () => {
      const records = [record({ user_login: 'alice' })];
      const result = filterRecords(records, { user: 'charlie' });
      expect(result).toHaveLength(0);
    });
  });

  describe('IDE filter', () => {
    it('keeps records that have the specified IDE', () => {
      const records = [
        record({ totals_by_ide: [{ ide: 'vscode' }] }),
        record({ totals_by_ide: [{ ide: 'jetbrains' }] }),
        record({ totals_by_ide: [{ ide: 'vscode' }, { ide: 'vim' }] })
      ];
      const result = filterRecords(records, { ide: 'vscode' });
      expect(result).toHaveLength(2);
    });

    it('excludes records that do not have the specified IDE', () => {
      const records = [record({ totals_by_ide: [{ ide: 'jetbrains' }] })];
      const result = filterRecords(records, { ide: 'vscode' });
      expect(result).toHaveLength(0);
    });
  });

  describe('language filter', () => {
    it('keeps records that include the specified language', () => {
      const records = [
        record({ totals_by_language_feature: [{ language: 'python' }] }),
        record({ totals_by_language_feature: [{ language: 'typescript' }] })
      ];
      const result = filterRecords(records, { language: 'python' });
      expect(result).toHaveLength(1);
    });
  });

  it('applies multiple criteria together (AND logic)', () => {
    const records = [
      record({ user_login: 'alice', day: '2025-06-15', totals_by_ide: [{ ide: 'vscode' }] }),
      record({ user_login: 'bob',   day: '2025-06-15', totals_by_ide: [{ ide: 'vscode' }] }),
      record({ user_login: 'alice', day: '2025-06-20', totals_by_ide: [{ ide: 'vscode' }] }),
      record({ user_login: 'alice', day: '2025-06-15', totals_by_ide: [{ ide: 'jetbrains' }] })
    ];
    const result = filterRecords(records, { user: 'alice', dateTo: '2025-06-15', ide: 'vscode' });
    expect(result).toHaveLength(1);
    expect(result[0].user_login).toBe('alice');
    expect(result[0].day).toBe('2025-06-15');
  });
});

describe('quickRangeDates', () => {
  it('returns the last N days from the max date', () => {
    const records = [
      record({ day: '2025-06-01' }),
      record({ day: '2025-06-30' }),
      record({ day: '2025-06-15' })
    ];
    const { dateFrom, dateTo } = quickRangeDates(records, 7);
    expect(dateTo).toBe('2025-06-30');
    const from = new Date(dateFrom);
    const to   = new Date(dateTo);
    const diffDays = Math.round((to - from) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(7);
  });

  it('returns empty strings for empty records', () => {
    const { dateFrom, dateTo } = quickRangeDates([], 7);
    expect(dateFrom).toBe('');
    expect(dateTo).toBe('');
  });
});

describe('extractFilterOptions', () => {
  it('extracts unique sorted users', () => {
    const records = [record({ user_login: 'charlie' }), record({ user_login: 'alice' }), record({ user_login: 'alice' })];
    const { users } = extractFilterOptions(records);
    expect(users).toEqual(['alice', 'charlie']);
  });

  it('extracts unique sorted IDEs', () => {
    const records = [
      record({ totals_by_ide: [{ ide: 'vscode' }, { ide: 'vim' }] }),
      record({ totals_by_ide: [{ ide: 'vscode' }] }),
      record({ totals_by_ide: [{ ide: 'jetbrains' }] })
    ];
    const { ides } = extractFilterOptions(records);
    expect(ides).toEqual(['jetbrains', 'vim', 'vscode']);
  });

  it('extracts unique sorted languages', () => {
    const records = [
      record({ totals_by_language_feature: [{ language: 'rust' }, { language: 'go' }] }),
      record({ totals_by_language_feature: [{ language: 'python' }] })
    ];
    const { languages } = extractFilterOptions(records);
    expect(languages).toEqual(['go', 'python', 'rust']);
  });

  it('returns empty arrays for empty input', () => {
    const { users, ides, languages } = extractFilterOptions([]);
    expect(users).toEqual([]);
    expect(ides).toEqual([]);
    expect(languages).toEqual([]);
  });
});
