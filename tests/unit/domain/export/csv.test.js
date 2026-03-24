import { describe, it, expect } from 'vitest';
import {
  buildDataCSV,
  buildActivityKpiCSV,
  buildLocKpiCSV,
  buildFeatureAdoptionCSV,
  buildInsightsCSV,
  buildActivityChartCSV,
  buildTopUsersCSV
} from '../../../../app/domain/export/csv.js';

const valueConfig = { MANUAL_LINES_PER_HOUR: 30, BLENDED_RATE_PER_HOUR: 90 };

function record(overrides = {}) {
  return {
    user_login: 'alice',
    day: '2025-01-01',
    code_generation_activity_count: 10,
    code_acceptance_activity_count: 5,
    loc_added_sum: 300,
    loc_deleted_sum: 60,
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

function aggregated(overrides = {}) {
  return {
    byUser: {
      alice: { generations: 100, acceptances: 70, linesAdded: 300, linesDeleted: 60, activeTime: 60, days: new Set(['2025-01-01']), features: new Set(['code_completion']) }
    },
    byDay: {
      '2025-01-01': { generations: 100, chatCount: 10, linesAdded: 300, linesDeleted: 60, activeUsers: 1 }
    },
    byIDE: {},
    byLanguage: {},
    byFeature: { code_completion: { generations: 100, acceptances: 70 } },
    byModel: {},
    ...overrides
  };
}

describe('buildDataCSV', () => {
  it('includes header row with correct columns', () => {
    const csv = buildDataCSV([record()], valueConfig);
    const header = csv.split('\n')[0];
    expect(header).toContain('User');
    expect(header).toContain('Days Active');
    expect(header).toContain('Generations');
    expect(header).toContain('Net Lines');
    expect(header).toContain('Value Added');
    expect(header).toContain('Net Value');
  });

  it('has one data row per user', () => {
    const csv = buildDataCSV([record(), record({ user_login: 'bob', day: '2025-01-02' })], valueConfig);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(3); // 1 header + 2 users
  });

  it('computes value columns correctly', () => {
    const r = record({ loc_added_sum: 300, loc_deleted_sum: 0 });
    const csv = buildDataCSV([r], { MANUAL_LINES_PER_HOUR: 30, BLENDED_RATE_PER_HOUR: 90 });
    // value added: 300/30*90 = 900; net = 900
    expect(csv).toContain('900.00');
  });

  it('tracks days active correctly', () => {
    const csv = buildDataCSV([record(), record({ day: '2025-01-02' })], valueConfig);
    // alice has 2 records on different days → Days Active = 2
    expect(csv).toContain('alice,2,');
  });

  it('sorts by net lines descending', () => {
    const records = [
      record({ user_login: 'alice', loc_added_sum: 100, loc_deleted_sum: 90 }), // net 10
      record({ user_login: 'bob',   loc_added_sum: 300, loc_deleted_sum: 0  }), // net 300
    ];
    const lines = buildDataCSV(records, valueConfig).split('\n');
    expect(lines[1]).toContain('bob');
    expect(lines[2]).toContain('alice');
  });

  it('handles empty records array', () => {
    const csv = buildDataCSV([], valueConfig);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(1); // header only
  });
});

describe('buildActivityKpiCSV', () => {
  it('includes Total Users row', () => {
    const csv = buildActivityKpiCSV(aggregated());
    expect(csv).toContain('Total Users');
    expect(csv).toContain('1'); // one user
  });

  it('includes header row', () => {
    const csv = buildActivityKpiCSV(aggregated());
    expect(csv.split('\n')[0]).toContain('Metric');
  });
});

describe('buildLocKpiCSV', () => {
  it('includes Lines Added and Net Lines rows', () => {
    const csv = buildLocKpiCSV(aggregated(), valueConfig);
    expect(csv).toContain('Lines Added');
    expect(csv).toContain('Net Lines');
  });

  it('includes value rows', () => {
    const csv = buildLocKpiCSV(aggregated(), valueConfig);
    expect(csv).toContain('Value');
  });
});

describe('buildFeatureAdoptionCSV', () => {
  it('includes Feature Key and Label columns', () => {
    const csv = buildFeatureAdoptionCSV(aggregated());
    expect(csv.split('\n')[0]).toContain('Feature Key');
    expect(csv.split('\n')[0]).toContain('Label');
  });

  it('includes percentage column', () => {
    const csv = buildFeatureAdoptionCSV(aggregated());
    expect(csv).toContain('%');
  });
});

describe('buildInsightsCSV', () => {
  it('produces empty CSV for no insights', () => {
    const csv = buildInsightsCSV([]);
    expect(csv.split('\n')).toHaveLength(1); // header only
  });

  it('has one row per insight', () => {
    const insights = [
      { title: 'Power Users', type: 'success', content: 'alice (1K gens)' },
      { title: 'Quota Exceeded', type: 'error', content: 'bob on 2025-01-01' }
    ];
    const csv = buildInsightsCSV(insights);
    expect(csv.split('\n')).toHaveLength(3); // header + 2 rows
  });

  it('includes type column', () => {
    const csv = buildInsightsCSV([{ title: 'Test', type: 'warning', content: 'stuff' }]);
    expect(csv).toContain('warning');
  });
});

describe('buildActivityChartCSV', () => {
  it('sorts by date', () => {
    const agg = aggregated({
      byDay: {
        '2025-01-02': { generations: 20, chatCount: 0, linesAdded: 0, linesDeleted: 0, activeUsers: 1 },
        '2025-01-01': { generations: 10, chatCount: 0, linesAdded: 0, linesDeleted: 0, activeUsers: 1 }
      }
    });
    const csv = buildActivityChartCSV(agg);
    const lines = csv.split('\n');
    expect(lines[1]).toContain('2025-01-01');
    expect(lines[2]).toContain('2025-01-02');
  });
});

describe('buildTopUsersCSV', () => {
  it('sorts users by generations descending', () => {
    const agg = aggregated({
      byUser: {
        alice: { generations: 50,  acceptances: 30, linesAdded: 0, linesDeleted: 0, activeTime: 0, days: new Set(), features: new Set() },
        bob:   { generations: 200, acceptances: 80, linesAdded: 0, linesDeleted: 0, activeTime: 0, days: new Set(), features: new Set() }
      }
    });
    const csv = buildTopUsersCSV(agg);
    const lines = csv.split('\n');
    expect(lines[1]).toContain('bob');
    expect(lines[2]).toContain('alice');
  });

  it('respects the limit parameter', () => {
    const byUser = {};
    for (let i = 0; i < 20; i++) {
      byUser[`user${i}`] = { generations: (20 - i) * 100, acceptances: 50, linesAdded: 0, linesDeleted: 0, activeTime: 0, days: new Set(), features: new Set() };
    }
    const csv = buildTopUsersCSV({ ...aggregated(), byUser }, 5);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(6); // header + 5
  });
});
