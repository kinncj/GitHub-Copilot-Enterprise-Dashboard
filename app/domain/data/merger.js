/**
 * Merges an array of CopilotRecords that may contain overlapping date ranges.
 *
 * GitHub Copilot Enterprise exports are 28-day rolling windows, so loading two
 * adjacent exports produces duplicate (user_login + day) records. For the same
 * user+day pair the data should be identical — we take Math.max as a safe merge
 * strategy, and keep the first-seen nested arrays (breakdowns don't change).
 *
 * @param {import('../../../common/types/index.js').CopilotRecord[]} records
 * @returns {import('../../../common/types/index.js').CopilotRecord[]}
 */
export function mergeRecords(records) {
  /** @type {Map<string, import('../../../common/types/index.js').CopilotRecord>} */
  const byKey = new Map();

  for (const r of records) {
    const key = r.user_login + '|' + r.day;

    if (!byKey.has(key)) {
      byKey.set(key, { ...r });
      continue;
    }

    const existing = byKey.get(key);
    existing.code_generation_activity_count  = Math.max(existing.code_generation_activity_count  || 0, r.code_generation_activity_count  || 0);
    existing.code_acceptance_activity_count  = Math.max(existing.code_acceptance_activity_count  || 0, r.code_acceptance_activity_count  || 0);
    existing.loc_added_sum                   = Math.max(existing.loc_added_sum                   || 0, r.loc_added_sum                   || 0);
    existing.loc_deleted_sum                 = Math.max(existing.loc_deleted_sum                 || 0, r.loc_deleted_sum                 || 0);
    existing.active_time_minutes             = Math.max(existing.active_time_minutes             || 0, r.active_time_minutes             || 0);
    existing.loc_suggested_to_add_sum        = Math.max(existing.loc_suggested_to_add_sum        || 0, r.loc_suggested_to_add_sum        || 0);
    // booleans: true wins
    if (r.used_agent) existing.used_agent = true;
    if (r.used_chat)  existing.used_chat  = true;
    // nested arrays: keep first-seen — same day = same breakdown
  }

  return [...byKey.values()];
}
