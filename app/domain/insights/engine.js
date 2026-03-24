import { CONFIG } from '../config/constants.js';
import { formatNumber } from '../../../common/utils/format.js';

/**
 * Generates insight cards from aggregated data.
 * Pure function — no DOM access, no side effects.
 *
 * @param {import('../../../common/types/index.js').AggregatedData} aggregated
 * @param {import('../../../common/types/index.js').CopilotRecord[]} filteredRecords
 * @param {typeof CONFIG} [config]
 * @returns {import('../../../common/types/index.js').Insight[]}
 */
export function generateInsights(aggregated, filteredRecords, config = CONFIG) {
  const insights = [];
  const { byUser, byDay } = aggregated;

  // ── Power Users ────────────────────────────────────────────────────────────
  const userArray = Object.entries(byUser).map(([name, data]) => ({ name, ...data }));
  const sorted = [...userArray].sort((a, b) => b.generations - a.generations);
  const threshold = sorted[Math.floor(sorted.length * config.POWER_USER_PERCENTILE)]?.generations || 0;
  const powerUsers = sorted.filter(u => u.generations >= threshold).slice(0, 5);

  if (powerUsers.length > 0) {
    insights.push({
      title: 'Power Users',
      subtitle: 'Top 10% by generations (Copilot triggers) — not lines of code',
      type: 'success',
      icon: 'star',
      content: powerUsers.map(u => `${u.name} (${formatNumber(u.generations)} gens)`).join(', ')
    });
  }

  // ── High Efficiency Users ──────────────────────────────────────────────────
  const highEfficiency = userArray
    .filter(u => u.generations >= config.MIN_GENERATIONS_FOR_RATE)
    .map(u => ({ ...u, rate: u.acceptances / u.generations }))
    .filter(u => u.rate >= config.HIGH_ACCEPTANCE_THRESHOLD)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5);

  if (highEfficiency.length > 0) {
    insights.push({
      title: 'High Efficiency Users',
      subtitle: `≥70% acceptance rate with ≥${config.MIN_GENERATIONS_FOR_RATE} completions — excludes agent mode which doesn't track acceptances`,
      type: 'success',
      icon: 'trending-up',
      content: highEfficiency.map(u => `${u.name} (${(u.rate * 100).toFixed(1)}%)`).join(', ')
    });
  }

  // Low Acceptance Rate Alert intentionally omitted:
  // ~94% of activity is agent mode which doesn't track acceptances — low rates are normal.

  // ── Daily Quota Exceeded ───────────────────────────────────────────────────
  const quotaExceeded = filteredRecords
    .filter(r => r.code_generation_activity_count > config.DAILY_GENERATION_QUOTA)
    .map(r => `${r.user_login} on ${r.day} (${r.code_generation_activity_count})`)
    .slice(0, 5);

  if (quotaExceeded.length > 0) {
    insights.push({
      title: 'Daily Quota Exceeded',
      subtitle: `Days where a single user exceeded ${config.DAILY_GENERATION_QUOTA} generations — adjust threshold in CONFIG`,
      type: 'error',
      icon: 'alert-circle',
      content: quotaExceeded.join(', ')
    });
  }

  // ── Week-over-Week Trend ───────────────────────────────────────────────────
  const sortedDays = Object.keys(byDay).sort();
  if (sortedDays.length >= config.TREND_COMPARISON_DAYS * 2) {
    const recent   = sortedDays.slice(-config.TREND_COMPARISON_DAYS);
    const previous = sortedDays.slice(-config.TREND_COMPARISON_DAYS * 2, -config.TREND_COMPARISON_DAYS);

    const recentTotal   = recent.reduce((sum, d) => sum + byDay[d].generations, 0);
    const previousTotal = previous.reduce((sum, d) => sum + byDay[d].generations, 0);
    const change = previousTotal > 0 ? ((recentTotal - previousTotal) / previousTotal * 100) : 0;

    insights.push({
      title: 'Week-over-Week Trend',
      subtitle: 'Comparing most recent 7 days vs prior 7 days, by total generations',
      type: change > 0 ? 'success' : change < -10 ? 'warning' : 'info',
      icon: change > 0 ? 'trending-up' : 'trending-down',
      content: `${change > 0 ? '+' : ''}${change.toFixed(1)}% change in generations`
    });
  }

  // ── Zero Acceptance Days ───────────────────────────────────────────────────
  const zeroAcceptance = filteredRecords.filter(
    r => r.code_generation_activity_count > 0 && r.code_acceptance_activity_count === 0
  ).length;

  if (zeroAcceptance > 0) {
    insights.push({
      title: 'Zero Acceptance Days',
      subtitle: 'Expected in agent mode — these records are not necessarily a concern',
      type: 'warning',
      icon: 'x-circle',
      content: `${zeroAcceptance} user-days with generations but no acceptances`
    });
  }

  return insights;
}
