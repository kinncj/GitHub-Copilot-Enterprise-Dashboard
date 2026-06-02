import { CONFIG } from '../config/constants.js';
import { formatCredits, formatCurrency } from '../../../common/utils/format.js';

/**
 * Generates insight cards from aggregated AI Usage data.
 * Pure function — no DOM access, no side effects.
 *
 * @param {import('../../../common/types/index.js').AIUsageAggregated} aggregated
 * @param {import('../../../common/types/index.js').AIUsageRecord[]} records
 * @param {typeof CONFIG} [config]
 * @returns {import('../../../common/types/index.js').Insight[]}
 */
export function generateAIUsageInsights(aggregated, records, config = CONFIG) {
  const insights = [];
  const { byUser, byModel, bySku, totals } = aggregated;

  // ── Top Spenders ───────────────────────────────────────────────────────────
  const topSpenders = Object.entries(byUser)
    .sort((a, b) => b[1].gross - a[1].gross)
    .filter(([, u]) => u.gross > 0)
    .slice(0, config.TOP_SPENDERS_SHOWN);

  if (topSpenders.length > 0) {
    insights.push({
      title: 'Top Spenders',
      subtitle: 'Users with the highest gross AI-credit consumption in the selected period',
      type: 'info',
      icon: 'dollar-sign',
      content: topSpenders.map(([name, u]) => `${name} (${formatCurrency(u.gross)})`).join(', ')
    });
  }

  // ── Near-Quota Users ─────────────────────────────────────────────────────────
  const nearQuota = Object.entries(byUser)
    .filter(([, u]) => u.quota > 0 && u.credits >= u.quota * config.NEAR_QUOTA_THRESHOLD)
    .map(([name, u]) => ({ name, pct: (u.credits / u.quota) * 100 }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  if (nearQuota.length > 0) {
    insights.push({
      title: 'Near or Over Quota',
      subtitle: `Users at ≥${Math.round(config.NEAR_QUOTA_THRESHOLD * 100)}% of their monthly credit quota`,
      type: 'warning',
      icon: 'alert-circle',
      content: nearQuota.map(u => `${u.name} (${u.pct.toFixed(0)}%)`).join(', ')
    });
  }

  // ── Top Model ────────────────────────────────────────────────────────────────
  const topModel = Object.entries(byModel).sort((a, b) => b[1].credits - a[1].credits)[0];
  if (topModel) {
    const [name, m] = topModel;
    const share = totals.credits > 0 ? (m.credits / totals.credits) * 100 : 0;
    insights.push({
      title: 'Most-Used Model',
      subtitle: 'Model consuming the most AI credits',
      type: 'success',
      icon: 'cpu',
      content: `${name} — ${formatCredits(m.credits)} credits (${share.toFixed(1)}% of total)`
    });
  }

  // ── Auto-Routed vs Explicit ───────────────────────────────────────────────────
  let autoCredits = 0;
  let manualCredits = 0;
  for (const m of Object.values(byModel)) { autoCredits += m.auto; manualCredits += m.manual; }
  const routedTotal = autoCredits + manualCredits;
  if (routedTotal > 0) {
    const autoPct = (autoCredits / routedTotal) * 100;
    insights.push({
      title: 'Auto-Routed vs Explicit',
      subtitle: 'Share of credits on auto-selected models vs explicitly chosen ones',
      type: 'info',
      icon: 'shuffle',
      content: `${autoPct.toFixed(1)}% auto-routed, ${(100 - autoPct).toFixed(1)}% explicit`
    });
  }

  // ── Coding-Agent Share ─────────────────────────────────────────────────────────
  const codingAgentCredits = Object.entries(bySku)
    .filter(([sku]) => sku.includes('coding_agent'))
    .reduce((s, [, v]) => s + v.credits, 0);
  if (totals.credits > 0 && codingAgentCredits > 0) {
    const pct = (codingAgentCredits / totals.credits) * 100;
    insights.push({
      title: 'Coding-Agent Usage',
      subtitle: 'Share of credits spent on the autonomous coding agent (vs chat/completions)',
      type: 'info',
      icon: 'bot',
      content: `${pct.toFixed(1)}% of credits (${formatCredits(codingAgentCredits)})`
    });
  }

  return insights;
}
