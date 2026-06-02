/**
 * Aggregates AI Usage (credit/cost) records into dimension-keyed rollups.
 * Pure function — no side effects, no DOM access. Sibling of
 * app/domain/data/aggregator.js, but for the billing dataset.
 *
 * @param {import('../../../common/types/index.js').AIUsageRecord[]} records
 * @returns {import('../../../common/types/index.js').AIUsageAggregated}
 */
export function aggregateAIUsage(records) {
  const byUser       = {};
  const byDay        = {};
  const byModel      = {};
  const byOrg        = {};
  const byCostCenter = {};
  const bySku        = {};

  const totals = { credits: 0, gross: 0, net: 0, discount: 0 };

  for (const r of records) {
    totals.credits  += r.quantity;
    totals.gross    += r.grossAmount;
    totals.net      += r.netAmount;
    totals.discount += r.discountAmount;

    // ── By user ──────────────────────────────────────────────
    if (!byUser[r.username]) {
      byUser[r.username] = {
        credits: 0, gross: 0, net: 0, quota: 0,
        days: new Set(), models: new Set()
      };
    }
    const u = byUser[r.username];
    u.credits += r.quantity;
    u.gross   += r.grossAmount;
    u.net     += r.netAmount;
    u.quota    = Math.max(u.quota, r.monthlyQuota);
    u.days.add(r.date);
    if (r.model) u.models.add(r.model);

    // ── By day ───────────────────────────────────────────────
    if (!byDay[r.date]) byDay[r.date] = { credits: 0, gross: 0, net: 0, users: new Set() };
    const d = byDay[r.date];
    d.credits += r.quantity;
    d.gross   += r.grossAmount;
    d.net     += r.netAmount;
    d.users.add(r.username);

    // ── By model (base name; track auto vs explicit) ─────────
    const modelKey = r.baseModel || r.model || 'unknown';
    if (!byModel[modelKey]) byModel[modelKey] = { credits: 0, gross: 0, auto: 0, manual: 0 };
    const m = byModel[modelKey];
    m.credits += r.quantity;
    m.gross   += r.grossAmount;
    if (r.isAuto) m.auto += r.quantity; else m.manual += r.quantity;

    // ── By org / cost center / sku ───────────────────────────
    accumulate(byOrg,        r.organization || 'Unattributed', r);
    accumulate(byCostCenter, r.costCenter   || 'Unattributed', r);
    accumulate(bySku,        r.sku          || 'unknown',      r);
  }

  // Convert Sets to counts (same idiom as the activity aggregator)
  for (const u of Object.values(byUser)) {
    u.daysActive = u.days.size;
    u.modelCount = u.models.size;
  }
  for (const d of Object.values(byDay)) {
    d.activeUsers = d.users.size;
    delete d.users;
  }

  return { totals, byUser, byDay, byModel, byOrg, byCostCenter, bySku };
}

function accumulate(bucket, key, r) {
  if (!bucket[key]) bucket[key] = { credits: 0, gross: 0, net: 0 };
  bucket[key].credits += r.quantity;
  bucket[key].gross   += r.grossAmount;
  bucket[key].net     += r.netAmount;
}
