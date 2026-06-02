import { stripBOM } from '../aiusage/parser.js';

/**
 * Detects which dataset a file holds so the upload flow can route it to the
 * correct parser.
 *
 * - `'aiusage'` — a GitHub AI Usage Report CSV (credit/cost). Identified by a
 *   CSV header row containing `username` plus a credit/quantity column.
 * - `'activity'` — a Copilot activity NDJSON/JSON export (the default).
 *
 * @param {string} filename
 * @param {string} text - raw file contents (a prefix is sufficient)
 * @returns {'aiusage'|'activity'}
 */
export function detectFileType(filename, text) {
  const name = (filename || '').toLowerCase();
  const head = stripBOM(text || '').trimStart();

  // NDJSON/JSON lines start with an object brace — always activity.
  if (head[0] === '{' || head[0] === '[') return 'activity';

  // Require a stronger column signature so unrelated CSVs (seat/billing exports,
  // arbitrary spreadsheets) don't get misrouted into the AI Usage pipeline.
  const firstLine = head.split('\n', 1)[0].toLowerCase();
  const has = col => firstLine.includes(col);
  const looksLikeUsageHeader =
    has('username') &&
    (has('quantity') || has('aic_quantity')) &&
    (has('unit_type') || has('gross_amount') || has('net_amount')) &&
    (has('model') || has('sku') || has('total_monthly_quota'));

  return looksLikeUsageHeader ? 'aiusage' : 'activity';
}
