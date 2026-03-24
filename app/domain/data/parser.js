import { CONFIG } from '../config/constants.js';

/**
 * Normalises a raw NDJSON object into a typed CopilotRecord.
 * Returns null for records that lack the required user_login + day fields.
 * @param {unknown} raw
 * @returns {import('../../../common/types/index.js').CopilotRecord|null}
 */
export function normalizeRecord(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (!raw.user_login || !raw.day) return null;

  return {
    user_login:                       String(raw.user_login),
    day:                              String(raw.day),
    code_generation_activity_count:   Number(raw.code_generation_activity_count)  || 0,
    code_acceptance_activity_count:   Number(raw.code_acceptance_activity_count)  || 0,
    loc_added_sum:                    Number(raw.loc_added_sum)                   || 0,
    loc_deleted_sum:                  Number(raw.loc_deleted_sum)                 || 0,
    active_time_minutes:              Number(raw.active_time_minutes)             || 0,
    totals_by_ide:                    Array.isArray(raw.totals_by_ide)            ? raw.totals_by_ide            : [],
    totals_by_feature:                Array.isArray(raw.totals_by_feature)        ? raw.totals_by_feature        : [],
    totals_by_language_feature:       Array.isArray(raw.totals_by_language_feature) ? raw.totals_by_language_feature : [],
    totals_by_language_model:         Array.isArray(raw.totals_by_language_model) ? raw.totals_by_language_model : [],
    totals_by_model_feature:          Array.isArray(raw.totals_by_model_feature)  ? raw.totals_by_model_feature  : [],
    model:                            raw.model ? String(raw.model) : 'unknown'
  };
}

/**
 * Parses an NDJSON string into CopilotRecord[].
 * Processes in chunks to keep the call stack free for the caller to yield back to the browser.
 *
 * @param {string} text - raw file contents
 * @param {{ onProgress?: (pct: number) => void }} [opts]
 * @returns {Promise<import('../../../common/types/index.js').CopilotRecord[]>}
 */
export async function parseNDJSON(text, opts = {}) {
  const { onProgress } = opts;
  const lines = text.split('\n').filter(l => l.trim());
  const total = lines.length;
  const records = [];
  let parsed = 0;

  for (let i = 0; i < lines.length; i += CONFIG.CHUNK_SIZE) {
    const chunk = lines.slice(i, i + CONFIG.CHUNK_SIZE);

    for (const line of chunk) {
      try {
        const record = normalizeRecord(JSON.parse(line));
        if (record) records.push(record);
      } catch {
        // skip malformed JSON lines
      }
      parsed++;
    }

    if (onProgress) onProgress((parsed / total) * 100);

    // yield to allow UI updates between chunks
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return records;
}
