/**
 * Budget & burn-rate projections for AI-credit usage.
 *
 * The AI Usage Report carries a per-user `total_monthly_quota` (in credits) but
 * an export usually only covers a few days. The budget question is therefore a
 * *projection*: at the current run rate, where will consumption land by the end
 * of the month, relative to the available quota — at the individual, org, and
 * enterprise level.
 *
 * Projection model (run-rate): keep actual consumption for elapsed days, then
 * extend the observed daily average across the remaining days of the month.
 *   rate      = consumed / daysObserved        (observed daily average)
 *   projected = consumed + rate * remainingDays = consumed * factor
 *   factor    = 1 + remainingDays / daysObserved
 *
 * Pure function — no DOM, no side effects.
 */
import { CONFIG } from '../config/constants.js';

function parseUTC(d) { return new Date(d + 'T00:00:00Z'); }

/** Inclusive calendar-day span between two YYYY-MM-DD strings (≥1). */
function daySpanInclusive(a, b) {
  return Math.round((parseUTC(b) - parseUTC(a)) / 86_400_000) + 1;
}

/** Number of days in the calendar month of a YYYY-MM-DD string. */
function monthLength(d) {
  const dt = parseUTC(d);
  return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0)).getUTCDate();
}

/**
 * Names a license tier from its per-seat monthly credit allowance. GitHub's
 * standard rates: Copilot Business = 1,900, Copilot Enterprise = 3,900.
 */
function tierName(quota) {
  if (quota === 1900) return 'Copilot Business';
  if (quota === 3900) return 'Copilot Enterprise';
  return quota ? `${quota.toLocaleString()}-credit tier` : 'No-quota tier';
}

/**
 * Derives a default license configuration from the records: for each org, one
 * license row per distinct quota tier, with `seats` defaulted to the number of
 * *active* users at that tier. Using these defaults reproduces the CSV-derived
 * budget — the user then bumps seats up to their real licensed count (the export
 * only contains active users) or adds tiers the export doesn't show.
 *
 * @param {import('../../../common/types/index.js').AIUsageRecord[]} records
 * @returns {{orgs: Object.<string, {name: string, quota: number, seats: number}[]>}}
 */
export function deriveDefaultLicenses(records) {
  const orgTierUsers = new Map(); // org -> Map<quota, Set<user>>
  for (const r of records) {
    const org = r.organization || 'Unattributed';
    const quota = r.monthlyQuota || 0;
    if (!orgTierUsers.has(org)) orgTierUsers.set(org, new Map());
    const tiers = orgTierUsers.get(org);
    if (!tiers.has(quota)) tiers.set(quota, new Set());
    tiers.get(quota).add(r.username);
  }

  const orgs = {};
  for (const [org, tiers] of orgTierUsers) {
    orgs[org] = [...tiers.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([quota, users]) => ({
        name: tierName(quota),
        quota,
        seats: users.size
      }));
  }
  return { orgs };
}

/**
 * @param {import('../../../common/types/index.js').AIUsageRecord[]} records
 * @param {{enabled?: boolean, orgs?: Object.<string, {quota: number, seats: number}[]>}|null} [licenseConfig]
 *   When `enabled`, org/enterprise budgets come from configured seats × per-seat
 *   quota instead of the sum of active-user quotas. Individual budgets always use
 *   the per-user quota from the CSV.
 * @returns {import('../../../common/types/index.js').AIUsageBudget|null}
 */
export function computeAIUsageBudget(records, licenseConfig = null) {
  if (!records.length) return null;

  let minDate = null;
  let maxDate = null;
  const userQuota   = new Map(); // user -> max monthly quota
  const userCredits = new Map(); // user -> credits consumed
  const userNet     = new Map(); // user -> net $ billed
  const orgUsers    = new Map(); // org  -> Set<user>
  const orgCredits  = new Map(); // org  -> credits consumed
  const orgNet      = new Map(); // org  -> net $ billed
  const months      = new Set(); // distinct YYYY-MM
  let totalCredits = 0;
  let totalGross = 0;
  let totalNet = 0;

  for (const r of records) {
    if (!minDate || r.date < minDate) minDate = r.date;
    if (!maxDate || r.date > maxDate) maxDate = r.date;
    months.add(r.date.slice(0, 7));

    userQuota.set(r.username, Math.max(userQuota.get(r.username) || 0, r.monthlyQuota || 0));
    userCredits.set(r.username, (userCredits.get(r.username) || 0) + r.quantity);
    userNet.set(r.username, (userNet.get(r.username) || 0) + r.netAmount);

    const org = r.organization || 'Unattributed';
    if (!orgUsers.has(org)) orgUsers.set(org, new Set());
    orgUsers.get(org).add(r.username);
    orgCredits.set(org, (orgCredits.get(org) || 0) + r.quantity);
    orgNet.set(org, (orgNet.get(org) || 0) + r.netAmount);

    totalCredits += r.quantity;
    totalGross   += r.grossAmount;
    totalNet     += r.netAmount;
  }

  const daysObserved  = daySpanInclusive(minDate, maxDate);
  const daysInMonth   = monthLength(maxDate);
  const dayOfMonth    = Number(maxDate.slice(8, 10));
  const remainingDays = Math.max(0, daysInMonth - dayOfMonth);
  const factor        = 1 + remainingDays / daysObserved;

  const proj = (consumed, budget) => {
    const projected = consumed * factor;
    return {
      budget,
      consumed,
      projected,
      remaining: budget - consumed,
      overage:          Math.max(0, consumed - budget),
      projectedOverage: Math.max(0, projected - budget),
      consumedPct:  budget > 0 ? consumed  / budget : 0,
      projectedPct: budget > 0 ? projected / budget : 0
    };
  };

  // ── Budget resolution: configured licenses vs CSV-derived (active users) ──
  const useCfg = !!(licenseConfig && licenseConfig.enabled);
  const cfgOrgs = (licenseConfig && licenseConfig.orgs) || {};

  const orgSeats = org => (cfgOrgs[org] || []).reduce((s, l) => s + (Number(l.seats) || 0), 0);
  const orgBudgetOf = org => {
    if (useCfg && cfgOrgs[org] && cfgOrgs[org].length) {
      return cfgOrgs[org].reduce((s, l) => s + (Number(l.seats) || 0) * (Number(l.quota) || 0), 0);
    }
    let b = 0;
    for (const u of (orgUsers.get(org) || [])) b += userQuota.get(u) || 0;
    return b;
  };

  // Union of orgs from the data and (when configured) from the license config.
  const orgNames = new Set(orgUsers.keys());
  if (useCfg) Object.keys(cfgOrgs).forEach(o => orgNames.add(o));

  let enterpriseBudget = 0;
  let enterpriseSeats = 0;
  for (const org of orgNames) {
    enterpriseBudget += orgBudgetOf(org);
    enterpriseSeats  += useCfg ? orgSeats(org) : (orgUsers.get(org)?.size || 0);
  }
  if (!useCfg) enterpriseBudget = [...userQuota.values()].reduce((s, q) => s + q, 0);

  const enterprise = {
    ...proj(totalCredits, enterpriseBudget),
    gross: totalGross,
    net: totalNet,
    daysObserved, daysInMonth, dayOfMonth, remainingDays, factor,
    minDate, maxDate, month: maxDate.slice(0, 7),
    users: userQuota.size,
    seats: enterpriseSeats,
    source: useCfg ? 'licenses' : 'active',
    confidence: daysObserved >= CONFIG.MIN_PROJECTION_DAYS ? 'ok' : 'low',
    multiMonth: months.size > 1,
    monthsSpanned: months.size
  };

  // ── Per org ──
  const byOrg = {};
  for (const org of orgNames) {
    byOrg[org] = {
      ...proj(orgCredits.get(org) || 0, orgBudgetOf(org)),
      net: orgNet.get(org) || 0,
      users: orgUsers.get(org)?.size || 0,
      seats: useCfg ? orgSeats(org) : (orgUsers.get(org)?.size || 0),
      usersOverAllowance: 0
    };
  }

  // ── Per user (the per-user quota from the CSV is each seat's contribution to
  // the pool, not a hard cap — included credits pool at the billing entity level) ──
  const byUser = {};
  for (const [user, consumed] of userCredits) {
    byUser[user] = { ...proj(consumed, userQuota.get(user) || 0), net: userNet.get(user) || 0 };
  }

  // Informational only: how many users are projected to draw more than their own
  // per-seat allowance. The shared pool absorbs this (lighter users offset heavy
  // ones); it only causes a block if the admin sets user-level budgets. Overage
  // billing itself is pooled — see enterprise.projectedOverage.
  let usersOverAllowance = 0;
  for (const line of Object.values(byUser)) {
    if (line.budget > 0 && line.projected > line.budget) usersOverAllowance++;
  }
  enterprise.usersOverAllowance = usersOverAllowance;
  for (const [org, users] of orgUsers) {
    if (!byOrg[org]) continue;
    for (const u of users) {
      const l = byUser[u];
      if (l && l.budget > 0 && l.projected > l.budget) byOrg[org].usersOverAllowance++;
    }
  }

  return { enterprise, byOrg, byUser };
}

/**
 * Budget-focused insight cards, derived from a computed budget object.
 * @param {import('../../../common/types/index.js').AIUsageBudget|null} budget
 * @param {{NEAR_QUOTA_THRESHOLD: number}} config
 * @returns {import('../../../common/types/index.js').Insight[]}
 */
export function generateBudgetInsights(budget, config) {
  if (!budget) return [];
  const insights = [];
  const { enterprise, byOrg, byUser } = budget;
  const near = config.NEAR_QUOTA_THRESHOLD;
  const fmtPct = v => `${(v * 100).toFixed(0)}%`;

  // Low confidence: too few observed days to trust the projection. Don't raise
  // alarms — downgrade everything to informational and label it preliminary.
  const low = enterprise.confidence === 'low';
  const prefix = low ? `Preliminary (${enterprise.daysObserved} day${enterprise.daysObserved === 1 ? '' : 's'}): ` : '';
  const escalate = (level) => (low ? 'info' : level);

  // Multi-month files break the monthly comparison — warn first.
  if (enterprise.multiMonth) {
    insights.push({
      title: 'Multi-Month Export',
      subtitle: 'This file spans more than one calendar month',
      type: 'warning',
      icon: 'alert-circle',
      content: `Data covers ${enterprise.monthsSpanned} months — the monthly budget projection assumes a single month and is unreliable here. Filter to one month for an accurate burn rate.`
    });
  }

  // Enterprise projection
  if (enterprise.budget > 0) {
    const over = enterprise.projectedPct > 1;
    const atRisk = enterprise.projectedPct >= near;
    insights.push({
      title: 'Enterprise Budget Projection',
      subtitle: `Run-rate over ${enterprise.daysObserved} observed day${enterprise.daysObserved === 1 ? '' : 's'} → end of ${enterprise.month} (${enterprise.daysInMonth} days)` + (low ? ' — low confidence' : ''),
      type: escalate(over ? 'error' : atRisk ? 'warning' : 'success'),
      icon: over && !low ? 'alert-circle' : 'trending-up',
      content: prefix + `projected ${Math.round(enterprise.projected).toLocaleString()} of ${enterprise.budget.toLocaleString()} credits — ${fmtPct(enterprise.projectedPct)} of budget` +
        (over ? ` (over by ${Math.round(enterprise.projected - enterprise.budget).toLocaleString()})` : '')
    });
  }

  // Projected overage charges — pooled at the billing entity level. Overage only
  // accrues once total consumption exceeds the total included allowance.
  if (enterprise.projectedOverage > 0) {
    const cr = Math.round(enterprise.projectedOverage);
    const dollars = Math.round(enterprise.projectedOverage * CONFIG.CREDIT_USD);
    insights.push({
      title: 'Projected Overage Charges',
      subtitle: 'Projected consumption beyond the pooled monthly allowance (credits pool across the billing entity)',
      type: escalate('error'),
      icon: 'alert-circle',
      content: prefix + `~${cr.toLocaleString()} credits over the pooled allowance → ~$${dollars.toLocaleString()} in overage at $0.01/credit (if overage is enabled; otherwise usage is blocked)`
    });
  }

  // Orgs projected over budget
  const orgsAtRisk = Object.entries(byOrg)
    .filter(([, o]) => o.budget > 0 && o.projectedPct >= near)
    .sort((a, b) => b[1].projectedPct - a[1].projectedPct);
  if (orgsAtRisk.length > 0) {
    insights.push({
      title: 'Organizations at Budget Risk',
      subtitle: `Projected to reach ≥${fmtPct(near)} of their credit budget this month` + (low ? ' — low confidence' : ''),
      type: escalate(orgsAtRisk.some(([, o]) => o.projectedPct > 1) ? 'error' : 'warning'),
      icon: 'alert-circle',
      content: prefix + orgsAtRisk.map(([org, o]) => `${org} (${fmtPct(o.projectedPct)})`).join(', ')
    });
  }

  // Heavy users drawing over their per-seat share. Informational: the pool
  // absorbs this unless the admin sets user-level budgets, which block the user.
  const usersOver = Object.entries(byUser)
    .filter(([, u]) => u.budget > 0 && u.projectedPct > 1)
    .sort((a, b) => b[1].projectedPct - a[1].projectedPct);
  if (usersOver.length > 0) {
    insights.push({
      title: 'Heavy Users (Over Per-Seat Share)',
      subtitle: 'Projected to draw more than their own seat allowance. Pooled credits cover this; only user-level budgets would block them.',
      type: 'info',
      icon: 'trending-up',
      content: prefix + `${usersOver.length} user${usersOver.length === 1 ? '' : 's'} — top: ` +
        usersOver.slice(0, 5).map(([u, d]) => `${u} (${fmtPct(d.projectedPct)})`).join(', ')
    });
  }

  return insights;
}
