import { CONFIG } from '../config/constants.js';

/**
 * Strips a leading UTF-8 BOM (U+FEFF) if present.
 * GitHub's AI Usage Report CSV is exported BOM-prefixed.
 * @param {string} text
 * @returns {string}
 */
export function stripBOM(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/**
 * Tokenises CSV text into rows of string fields.
 * RFC-4180-ish: handles double-quoted fields, "" escapes, commas and
 * newlines inside quotes, and both \n and \r\n line endings.
 *
 * @param {string} text
 * @returns {string[][]}
 */
export function parseCSVRows(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let started = false; // whether the current row has any content yet

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } // escaped quote
        else inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') { inQuotes = true; started = true; continue; }
    if (ch === ',') { row.push(field); field = ''; started = true; continue; }
    if (ch === '\r') continue; // swallow CR; \n handles the row break
    if (ch === '\n') {
      row.push(field);
      // skip fully-blank lines
      if (started || row.some(f => f !== '')) rows.push(row);
      row = []; field = ''; started = false;
      continue;
    }
    field += ch;
    started = true;
  }

  // flush trailing field/row (file may not end with a newline)
  if (started || field !== '' || row.length) {
    row.push(field);
    if (row.some(f => f !== '')) rows.push(row);
  }

  return rows;
}

/**
 * Normalises a raw CSV row (keyed by header→index map) into a typed
 * AIUsageRecord. Returns null when the required username + date are absent.
 *
 * @param {string[]} cells
 * @param {Record<string, number>} idx - header name → column index
 * @returns {import('../../../common/types/index.js').AIUsageRecord|null}
 */
export function normalizeAIUsageRecord(cells, idx) {
  const get = name => {
    const i = idx[name];
    return i === undefined ? '' : (cells[i] ?? '').trim();
  };
  const num = name => Number(get(name)) || 0;

  const username = get('username');
  const date = get('date');
  if (!username || !date) return null;

  const model = get('model');
  const isAuto = /^auto:/i.test(model);
  const baseModel = model.replace(/^auto:\s*/i, '');

  return {
    date,
    username,
    product:         get('product'),
    sku:             get('sku'),
    model,
    baseModel,
    isAuto,
    quantity:        num('quantity'),
    unitType:        get('unit_type'),
    costPerQuantity: num('applied_cost_per_quantity'),
    grossAmount:     num('gross_amount'),
    discountAmount:  num('discount_amount'),
    netAmount:       num('net_amount'),
    monthlyQuota:    num('total_monthly_quota'),
    organization:    get('organization'),
    repository:      get('repository'),
    costCenter:      get('cost_center_name'),
    aicQuantity:     num('aic_quantity'),
    aicGrossAmount:  num('aic_gross_amount')
  };
}

/**
 * Parses an AI Usage Report CSV string into AIUsageRecord[].
 * Column mapping is driven by the header row (order-independent).
 * Normalisation runs in chunks, yielding to the browser between batches.
 *
 * @param {string} text - raw file contents
 * @param {{ onProgress?: (pct: number) => void }} [opts]
 * @returns {Promise<import('../../../common/types/index.js').AIUsageRecord[]>}
 */
export async function parseAIUsageCSV(text, opts = {}) {
  const { onProgress } = opts;
  const rows = parseCSVRows(stripBOM(text));
  if (rows.length < 2) return [];

  const header = rows[0].map(h => h.trim().toLowerCase());
  /** @type {Record<string, number>} */
  const idx = {};
  header.forEach((name, i) => { if (!(name in idx)) idx[name] = i; });

  const dataRows = rows.slice(1);
  const total = dataRows.length;
  const records = [];
  let parsed = 0;

  for (let i = 0; i < dataRows.length; i += CONFIG.CHUNK_SIZE) {
    const chunk = dataRows.slice(i, i + CONFIG.CHUNK_SIZE);
    for (const cells of chunk) {
      const record = normalizeAIUsageRecord(cells, idx);
      if (record) records.push(record);
      parsed++;
    }
    if (onProgress) onProgress((parsed / total) * 100);
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return records;
}
