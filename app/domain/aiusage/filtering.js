/**
 * Filters an AIUsageRecord[] by the given criteria.
 * Pure function — reads no DOM, mutates no state.
 *
 * @param {import('../../../common/types/index.js').AIUsageRecord[]} records
 * @param {import('../../../common/types/index.js').AIUsageCriteria} criteria
 * @returns {import('../../../common/types/index.js').AIUsageRecord[]}
 */
export function filterAIUsage(records, criteria) {
  const { dateFrom, dateTo, user, model, org, costCenter } = criteria;

  return records.filter(r => {
    if (dateFrom && r.date < dateFrom) return false;
    if (dateTo   && r.date > dateTo)   return false;
    if (user     && r.username !== user) return false;
    // model filter matches the base (auto-stripped) model OR the raw label
    if (model && r.baseModel !== model && r.model !== model) return false;
    if (org        && r.organization !== org) return false;
    if (costCenter && r.costCenter   !== costCenter) return false;
    return true;
  });
}

/**
 * Extracts unique sorted values for populating AI Usage filter dropdowns.
 * @param {import('../../../common/types/index.js').AIUsageRecord[]} records
 * @returns {{ users: string[], models: string[], orgs: string[], costCenters: string[] }}
 */
export function extractAIUsageFilterOptions(records) {
  const users       = new Set();
  const models      = new Set();
  const orgs        = new Set();
  const costCenters = new Set();

  for (const r of records) {
    users.add(r.username);
    if (r.baseModel || r.model) models.add(r.baseModel || r.model);
    if (r.organization) orgs.add(r.organization);
    if (r.costCenter)   costCenters.add(r.costCenter);
  }

  return {
    users:       [...users].sort(),
    models:      [...models].sort(),
    orgs:        [...orgs].sort(),
    costCenters: [...costCenters].sort()
  };
}
