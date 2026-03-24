/**
 * Filters a CopilotRecord[] by the given criteria.
 * Pure function — reads no DOM, mutates no state.
 *
 * @param {import('../../../common/types/index.js').CopilotRecord[]} records
 * @param {import('../../../common/types/index.js').FilterCriteria} criteria
 * @returns {import('../../../common/types/index.js').CopilotRecord[]}
 */
export function filterRecords(records, criteria) {
  const { dateFrom, dateTo, user, ide, language } = criteria;

  return records.filter(record => {
    if (dateFrom && record.day < dateFrom) return false;
    if (dateTo   && record.day > dateTo)   return false;
    if (user     && record.user_login !== user) return false;

    if (ide) {
      const hasIDE = record.totals_by_ide.some(e => e.ide === ide);
      if (!hasIDE) return false;
    }

    if (language) {
      const hasLanguage = record.totals_by_language_feature.some(e => e.language === language);
      if (!hasLanguage) return false;
    }

    return true;
  });
}

/**
 * Returns a date range object covering the last N days from the max date in records.
 * @param {import('../../../common/types/index.js').CopilotRecord[]} records
 * @param {number} days
 * @returns {{ dateFrom: string, dateTo: string }}
 */
export function quickRangeDates(records, days) {
  if (!records.length) return { dateFrom: '', dateTo: '' };

  const maxMs   = Math.max(...records.map(r => new Date(r.day).getTime()));
  const maxDate = new Date(maxMs);
  const minDate = new Date(maxDate);
  minDate.setDate(minDate.getDate() - days);

  return {
    dateFrom: minDate.toISOString().split('T')[0],
    dateTo:   maxDate.toISOString().split('T')[0]
  };
}

/**
 * Extracts unique sorted values for populating filter dropdowns.
 * @param {import('../../../common/types/index.js').CopilotRecord[]} records
 * @returns {{ users: string[], ides: string[], languages: string[] }}
 */
export function extractFilterOptions(records) {
  const users     = new Set();
  const ides      = new Set();
  const languages = new Set();

  for (const r of records) {
    users.add(r.user_login);
    r.totals_by_ide.forEach(ide => ides.add(ide.ide));
    r.totals_by_language_feature.forEach(lf => languages.add(lf.language));
  }

  return {
    users:     [...users].sort(),
    ides:      [...ides].sort(),
    languages: [...languages].sort()
  };
}
