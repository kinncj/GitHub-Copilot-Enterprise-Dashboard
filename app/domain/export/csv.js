import { humanizeFeature } from '../../../common/utils/format.js';

/**
 * Builds a CSV string from headers + rows.
 * @param {string[]} headers
 * @param {(string|number)[][]} rows
 * @returns {string}
 */
function buildCSV(headers, rows) {
  const escape = v => {
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [headers, ...rows].map(row => row.map(escape).join(',')).join('\n');
}

/**
 * Exports filtered records as raw per-user-per-day rows (no aggregation).
 * Used by the header "Export CSV" — preserves full date granularity.
 * @param {import('../../../common/types/index.js').CopilotRecord[]} records
 * @param {import('../../../common/types/index.js').ValueConfig} valueConfig
 * @returns {string}
 */
export function buildRawRecordsCSV(records, valueConfig) {
  const { MANUAL_LINES_PER_HOUR, BLENDED_RATE_PER_HOUR } = valueConfig;
  const headers = ['User', 'Date', 'Generations', 'Acceptances', 'Lines Added', 'Lines Deleted', 'Net Lines', 'Net Value'];

  const rows = records.map(r => {
    const net      = r.loc_added_sum - r.loc_deleted_sum;
    const netValue = ((net / MANUAL_LINES_PER_HOUR) * BLENDED_RATE_PER_HOUR).toFixed(2);
    return [r.user_login, r.day, r.code_generation_activity_count, r.code_acceptance_activity_count, r.loc_added_sum, r.loc_deleted_sum, net, netValue];
  });

  return buildCSV(headers, rows);
}

/**
 * Exports filtered records as a CSV aggregated per user over the filtered period.
 * @param {import('../../../common/types/index.js').CopilotRecord[]} records
 * @param {import('../../../common/types/index.js').ValueConfig} valueConfig
 * @returns {string}
 */
export function buildDataCSV(records, valueConfig) {
  const { MANUAL_LINES_PER_HOUR, BLENDED_RATE_PER_HOUR } = valueConfig;
  const headers = ['User', 'Days Active', 'Generations', 'Lines Added', 'Lines Deleted', 'Net Lines', 'Value Added', 'Value Deleted', 'Total Value'];

  const byUser = {};
  for (const r of records) {
    if (!byUser[r.user_login]) byUser[r.user_login] = { days: new Set(), gens: 0, linesAdded: 0, linesDeleted: 0 };
    byUser[r.user_login].days.add(r.day);
    byUser[r.user_login].gens       += r.code_generation_activity_count;
    byUser[r.user_login].linesAdded += r.loc_added_sum;
    byUser[r.user_login].linesDeleted += r.loc_deleted_sum;
  }

  const rate = (v) => ((v / MANUAL_LINES_PER_HOUR) * BLENDED_RATE_PER_HOUR).toFixed(2);

  const rows = Object.entries(byUser)
    .sort((a, b) => (b[1].linesAdded - b[1].linesDeleted) - (a[1].linesAdded - a[1].linesDeleted))
    .map(([user, d]) => {
      const net = d.linesAdded - d.linesDeleted;
      return [user, d.days.size, d.gens, d.linesAdded, d.linesDeleted, net, rate(d.linesAdded), rate(d.linesDeleted), rate(d.linesAdded + d.linesDeleted)];
    });

  return buildCSV(headers, rows);
}

/**
 * Builds a CSV summarising Activity KPIs.
 * @param {import('../../../common/types/index.js').AggregatedData} aggregated
 * @returns {string}
 */
export function buildActivityKpiCSV(aggregated) {
  const { byUser, byDay, byFeature } = aggregated;

  const totalUsers       = Object.keys(byUser).length;
  const totalGenerations = Object.values(byUser).reduce((s, u) => s + u.generations, 0);
  const chatCount        = (byFeature['chat']?.generations || 0) + (byFeature['chat_inline']?.generations || 0) + (byFeature['inline_chat']?.generations || 0);
  const activeDays       = Object.keys(byDay).length;

  return buildCSV(
    ['Metric', 'Value'],
    [
      ['Total Users', totalUsers],
      ['Total Generations', totalGenerations],
      ['Chat Interactions', chatCount],
      ['Active Days', activeDays]
    ]
  );
}

/**
 * Builds a CSV summarising Lines of Code KPIs.
 * @param {import('../../../common/types/index.js').AggregatedData} aggregated
 * @param {import('../../../common/types/index.js').ValueConfig} valueConfig
 * @returns {string}
 */
export function buildLocKpiCSV(aggregated, valueConfig) {
  const { MANUAL_LINES_PER_HOUR, BLENDED_RATE_PER_HOUR } = valueConfig;
  const { byUser } = aggregated;

  const linesAdded   = Object.values(byUser).reduce((s, u) => s + u.linesAdded,   0);
  const linesDeleted = Object.values(byUser).reduce((s, u) => s + u.linesDeleted, 0);
  const netLines     = linesAdded - linesDeleted;

  const rate = v => (v / MANUAL_LINES_PER_HOUR) * BLENDED_RATE_PER_HOUR;

  return buildCSV(
    ['Metric', 'Value', 'Formula'],
    [
      ['Lines Added',              linesAdded,           ''],
      ['Lines Deleted',            linesDeleted,         ''],
      ['Net Lines',                netLines,             'Added - Deleted'],
      ['Value (Total Changed)',    rate(linesAdded + linesDeleted).toFixed(2), `(added+deleted)/${MANUAL_LINES_PER_HOUR}×$${BLENDED_RATE_PER_HOUR}/hr`],
      ['Value (Lines Added Only)', rate(linesAdded).toFixed(2),               `added/${MANUAL_LINES_PER_HOUR}×$${BLENDED_RATE_PER_HOUR}/hr`],
      ['Value (Net Lines)',        rate(netLines).toFixed(2),                  `net/${MANUAL_LINES_PER_HOUR}×$${BLENDED_RATE_PER_HOUR}/hr`]
    ]
  );
}

/**
 * Builds a CSV of Feature Adoption.
 * @param {import('../../../common/types/index.js').AggregatedData} aggregated
 * @returns {string}
 */
export function buildFeatureAdoptionCSV(aggregated) {
  const { byUser, byFeature } = aggregated;
  const totalUsers = Object.keys(byUser).length;

  // Count users per feature
  const usersByFeature = {};
  for (const u of Object.values(byUser)) {
    for (const f of u.features) {
      usersByFeature[f] = (usersByFeature[f] || 0) + 1;
    }
  }

  const rows = Object.entries(byFeature)
    .sort((a, b) => b[1].generations - a[1].generations)
    .map(([key]) => {
      const { label } = humanizeFeature(key);
      const users = usersByFeature[key] || 0;
      const pct   = totalUsers > 0 ? ((users / totalUsers) * 100).toFixed(1) : '0.0';
      return [key, label, users, pct + '%'];
    });

  return buildCSV(['Feature Key', 'Label', 'Users', '% of Users'], rows);
}

/**
 * Builds a CSV of Insights & Anomalies.
 * @param {import('../../../common/types/index.js').Insight[]} insights
 * @returns {string}
 */
export function buildInsightsCSV(insights) {
  const rows = insights.map(i => [i.title, i.type, i.content]);
  return buildCSV(['Title', 'Type', 'Detail'], rows);
}

/**
 * Exports chart-specific data as CSV (activity timeline).
 * @param {import('../../../common/types/index.js').AggregatedData} aggregated
 * @returns {string}
 */
export function buildActivityChartCSV(aggregated) {
  const rows = Object.entries(aggregated.byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, d]) => [day, d.generations, d.chatCount, d.linesAdded, d.linesDeleted]);
  return buildCSV(['Date', 'Generations', 'Chat', 'Lines Added', 'Lines Deleted'], rows);
}

/**
 * Exports top users data as CSV.
 * @param {import('../../../common/types/index.js').AggregatedData} aggregated
 * @param {number} limit
 * @returns {string}
 */
export function buildTopUsersCSV(aggregated, limit = 15) {
  const rows = Object.entries(aggregated.byUser)
    .sort((a, b) => b[1].generations - a[1].generations)
    .slice(0, limit)
    .map(([user, d]) => {
      const rate = d.generations > 0 ? ((d.acceptances / d.generations) * 100).toFixed(1) : '0.0';
      return [user, d.generations, d.acceptances, rate + '%'];
    });
  return buildCSV(['User', 'Generations', 'Acceptances', 'Acceptance Rate'], rows);
}
