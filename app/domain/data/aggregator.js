/**
 * Returns the ISO Monday (week start) for a given YYYY-MM-DD string.
 * @param {string} dayStr
 * @returns {string} YYYY-MM-DD of the Monday of that week
 */
function getWeekStart(dayStr) {
  const d = new Date(dayStr + 'T00:00:00Z');
  const dow = d.getUTCDay(); // 0=Sun,1=Mon,...,6=Sat
  const diff = dow === 0 ? -6 : 1 - dow; // shift to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

/**
 * Aggregates a flat list of CopilotRecords into dimension-keyed rollups.
 * Pure function — no side effects, no DOM access.
 *
 * @param {import('../../../common/types/index.js').CopilotRecord[]} records
 * @returns {import('../../../common/types/index.js').AggregatedData}
 */
export function aggregateData(records) {
  const byUser     = {};
  const byDay      = {};
  const byWeek     = {};
  const byIDE      = {};
  const byLanguage = {};
  const byFeature  = {};
  const byModel    = {};

  for (const record of records) {
    // ── By user ──────────────────────────────────────────────
    if (!byUser[record.user_login]) {
      byUser[record.user_login] = {
        generations: 0,
        acceptances: 0,
        linesAdded: 0,
        linesDeleted: 0,
        locSuggested: 0,
        activeTime: 0,
        usedAgent: false,
        days: new Set(),
        features: new Set()
      };
    }
    const user = byUser[record.user_login];
    user.generations   += record.code_generation_activity_count;
    user.acceptances   += record.code_acceptance_activity_count;
    user.linesAdded    += record.loc_added_sum;
    user.linesDeleted  += record.loc_deleted_sum;
    user.locSuggested  += record.loc_suggested_to_add_sum;
    user.activeTime    += record.active_time_minutes;
    if (record.used_agent) user.usedAgent = true;
    user.days.add(record.day);
    for (const f of record.totals_by_feature) {
      if ((f.code_generation_activity_count || 0) > 0 || (f.count || 0) > 0) {
        user.features.add(f.feature);
      }
    }

    // ── By day ───────────────────────────────────────────────
    if (!byDay[record.day]) {
      byDay[record.day] = {
        generations: 0,
        acceptances: 0,
        linesAdded: 0,
        linesDeleted: 0,
        locSuggested: 0,
        chatCount: 0,
        users: new Set()
      };
    }
    const day = byDay[record.day];
    day.generations   += record.code_generation_activity_count;
    day.acceptances   += record.code_acceptance_activity_count;
    day.linesAdded    += record.loc_added_sum;
    day.linesDeleted  += record.loc_deleted_sum;
    day.locSuggested  += record.loc_suggested_to_add_sum;
    day.users.add(record.user_login);
    const chatFeature = record.totals_by_feature.find(f => f.feature === 'chat' || f.feature === 'inline_chat');
    if (chatFeature) day.chatCount += chatFeature.count || 0;

    // ── By week ──────────────────────────────────────────────
    const weekKey = getWeekStart(record.day);
    if (!byWeek[weekKey]) byWeek[weekKey] = { users: new Set() };
    byWeek[weekKey].users.add(record.user_login);

    // ── By IDE ───────────────────────────────────────────────
    for (const ide of record.totals_by_ide) {
      if (!byIDE[ide.ide]) byIDE[ide.ide] = { generations: 0, acceptances: 0 };
      byIDE[ide.ide].generations += ide.code_generation_activity_count || 0;
      byIDE[ide.ide].acceptances += ide.code_acceptance_activity_count || 0;
    }

    // ── By language ──────────────────────────────────────────
    for (const lf of record.totals_by_language_feature) {
      if (!byLanguage[lf.language]) byLanguage[lf.language] = { generations: 0, acceptances: 0 };
      byLanguage[lf.language].generations += lf.code_generation_activity_count || 0;
      byLanguage[lf.language].acceptances += lf.code_acceptance_activity_count || 0;
    }

    // ── By feature ───────────────────────────────────────────
    for (const f of record.totals_by_feature) {
      if (!byFeature[f.feature]) byFeature[f.feature] = { generations: 0, acceptances: 0, linesAdded: 0, linesDeleted: 0 };
      byFeature[f.feature].generations  += f.code_generation_activity_count || 0;
      byFeature[f.feature].acceptances  += f.code_acceptance_activity_count || 0;
      byFeature[f.feature].linesAdded   += f.loc_added_sum || 0;
      byFeature[f.feature].linesDeleted += f.loc_deleted_sum || 0;
    }

    // ── By model ─────────────────────────────────────────────
    if (record.totals_by_language_model?.length > 0) {
      for (const lm of record.totals_by_language_model) {
        const model = lm.model || 'unknown';
        if (!byModel[model]) byModel[model] = 0;
        byModel[model] += lm.code_generation_activity_count || 0;
      }
    }
  }

  // Convert users Set to count on day entries
  for (const day of Object.values(byDay)) {
    day.activeUsers = day.users.size;
    delete day.users;
  }

  // Convert users Set to count on week entries
  for (const week of Object.values(byWeek)) {
    week.activeUsers = week.users.size;
    delete week.users;
  }

  return { byUser, byDay, byWeek, byIDE, byLanguage, byFeature, byModel };
}
