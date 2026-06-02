/**
 * CSV builders for the AI Usage (credit/cost) views.
 * Mirrors the escaping approach in app/domain/export/csv.js.
 */

/**
 * Builds a CSV string from headers + rows, quoting fields when needed.
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
 * Exports filtered AI Usage records as raw per-row CSV (full granularity).
 * @param {import('../../../common/types/index.js').AIUsageRecord[]} records
 * @returns {string}
 */
export function buildAIUsageRawCSV(records) {
  const headers = ['Date', 'User', 'SKU', 'Model', 'Auto', 'Credits', 'Gross', 'Net', 'Org', 'Cost Center'];
  const rows = records.map(r => [
    r.date, r.username, r.sku, r.model, r.isAuto ? 'yes' : 'no',
    r.quantity, r.grossAmount, r.netAmount, r.organization, r.costCenter
  ]);
  return buildCSV(headers, rows);
}

/**
 * Exports per-user aggregated AI Usage CSV.
 * @param {import('../../../common/types/index.js').AIUsageAggregated} aggregated
 * @returns {string}
 */
export function buildAIUsageUserCSV(aggregated) {
  const headers = ['User', 'Days Active', 'Credits', 'Gross', 'Net', 'Monthly Quota', '% of Quota', 'Models Used'];
  const rows = Object.entries(aggregated.byUser)
    .sort((a, b) => b[1].credits - a[1].credits)
    .map(([user, u]) => {
      const pct = u.quota > 0 ? ((u.credits / u.quota) * 100).toFixed(1) + '%' : 'n/a';
      return [user, u.daysActive, u.credits.toFixed(2), u.gross.toFixed(4), u.net.toFixed(4), u.quota, pct, u.modelCount];
    });
  return buildCSV(headers, rows);
}

/**
 * Exports per-model AI Usage CSV.
 * @param {import('../../../common/types/index.js').AIUsageAggregated} aggregated
 * @returns {string}
 */
export function buildAIUsageModelCSV(aggregated) {
  const headers = ['Model', 'Credits', 'Gross', 'Auto Credits', 'Explicit Credits'];
  const rows = Object.entries(aggregated.byModel)
    .sort((a, b) => b[1].credits - a[1].credits)
    .map(([model, m]) => [model, m.credits.toFixed(2), m.gross.toFixed(4), m.auto.toFixed(2), m.manual.toFixed(2)]);
  return buildCSV(headers, rows);
}
