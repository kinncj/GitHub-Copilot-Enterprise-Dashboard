import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { KpiCard } from '../kpi/KpiCard.jsx';
import { SectionDivider } from '../shared/SectionDivider.jsx';
import { formatNumber, formatCurrency, formatCredits } from '../../../../common/utils/format.js';
import { captureElementAsPng } from '../../../../common/utils/download.js';

export function AIUsageKpiSection() {
  const { aiUsageAggregated } = useApp();
  const ref = useRef(null);
  const { totals, byUser, byDay, byModel, bySku } = aiUsageAggregated;

  if (!byUser || !byDay) return null;

  const totalUsers = Object.keys(byUser).length;
  const activeDays = Object.keys(byDay).length;
  const avgCredits = totalUsers > 0 ? totals.credits / totalUsers : 0;

  const topModel = Object.entries(byModel).sort((a, b) => b[1].credits - a[1].credits)[0]?.[0] || 'N/A';

  const codingAgentCredits = Object.entries(bySku)
    .filter(([sku]) => sku.includes('coding_agent'))
    .reduce((s, [, v]) => s + v.credits, 0);
  const codingAgentShare = totals.credits > 0 ? ((codingAgentCredits / totals.credits) * 100).toFixed(1) : '0.0';

  return (
    <div ref={ref}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem' }}>
        <SectionDivider icon="dollar-sign" label="AI Credit Consumption" />
        <button className="btn-secondary" style={{ fontSize:'0.72rem' }} onClick={() => captureElementAsPng(ref.current, 'aiusage-kpi.png')}>PNG</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total Credits"
          value={formatCredits(totals.credits)}
          subtitle="AI credits consumed"
          tooltip="Sum of quantity (ai-credits) across all filtered rows."
        />
        <KpiCard
          label="Gross Value"
          value={formatCurrency(totals.gross)}
          subtitle="Pre-discount $ value"
          tooltip="Sum of gross_amount — the billed value of consumption before any quota discount."
        />
        <KpiCard
          label="Net Billed"
          value={formatCurrency(totals.net)}
          subtitle="After quota discount"
          tooltip="Sum of net_amount — what is actually charged. Often $0 while usage stays within the included monthly quota."
        />
        <KpiCard
          label="Active Users"
          value={formatNumber(totalUsers)}
          subtitle={`Over ${activeDays} active day${activeDays === 1 ? '' : 's'}`}
          tooltip="Distinct usernames in the filtered AI Usage rows."
        />
        <KpiCard
          label="Avg Credits / User"
          value={formatCredits(avgCredits)}
          subtitle="Mean consumption per user"
          tooltip="Total credits divided by distinct users."
        />
        <KpiCard
          label="Top Model"
          value={topModel}
          subtitle="Most credits consumed"
          tooltip="Model (auto prefix stripped) with the highest total credit consumption."
        />
        <KpiCard
          label="Coding-Agent Share"
          value={codingAgentShare + '%'}
          subtitle="Credits on the coding agent"
          tooltip="Share of credits on coding_agent_ai_credit SKU vs chat/completions credits."
        />
      </div>
    </div>
  );
}
