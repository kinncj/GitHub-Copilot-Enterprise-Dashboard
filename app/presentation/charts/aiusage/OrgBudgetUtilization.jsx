import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useChart } from '../hooks/useChart.js';
import { ChartCard } from '../ChartCard.jsx';
import { getChartDefaults } from '../chartOptions.js';
import { triggerDownload } from '../../../../common/utils/download.js';
import { CONFIG } from '../../../domain/config/constants.js';

/**
 * Per-org budget utilization: credits consumed and projected, each as a % of
 * that org's credit budget. The 100% line is the budget; projected bars turn
 * red once they cross it.
 */
export function OrgBudgetUtilization() {
  const { aiUsageBudget } = useApp();
  const byOrg = aiUsageBudget?.byOrg || {};

  const { canvasRef, chartRef } = useChart([JSON.stringify(byOrg)], () => {
    const rows = Object.entries(byOrg)
      .filter(([, o]) => o.budget > 0)
      .sort((a, b) => b[1].projectedPct - a[1].projectedPct);
    const labels = rows.map(([org]) => org);
    const consumed = rows.map(([, o]) => +(o.consumedPct * 100).toFixed(1));
    const projected = rows.map(([, o]) => +(o.projectedPct * 100).toFixed(1));
    const projColors = projected.map(p => p > 100 ? 'rgba(239,68,68,0.75)' : 'rgba(245,158,11,0.7)');
    const defaults = getChartDefaults();

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Consumed %', data: consumed, backgroundColor: 'rgba(52,211,153,0.6)', borderWidth: 0 },
          { label: 'Projected %', data: projected, backgroundColor: projColors, borderWidth: 0 }
        ]
      },
      options: {
        ...defaults,
        scales: {
          ...defaults.scales,
          y: { ...defaults.scales.y, title: { display: true, text: '% of org budget' }, beginAtZero: true }
        }
      }
    };
  });

  const handleCSV = () => {
    const rows = Object.entries(byOrg).filter(([, o]) => o.budget > 0)
      .sort((a, b) => b[1].projectedPct - a[1].projectedPct)
      .map(([org, o]) => `${org},${o.budget},${o.consumed.toFixed(2)},${o.projected.toFixed(2)},${(o.consumedPct * 100).toFixed(1)}%,${(o.projectedPct * 100).toFixed(1)}%`);
    const csv = 'Organization,Budget,Consumed,Projected,Consumed %,Projected %\n' + rows.join('\n');
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'org-budget-utilization.csv');
  };

  return (
    <ChartCard
      title="Org Budget Utilization"
      subtitle={`Consumed vs projected, as % of each org's credit budget (red = projected over 100%, alert ≥${Math.round(CONFIG.NEAR_QUOTA_THRESHOLD * 100)}%)`}
      onCSV={handleCSV} chartRef={chartRef} filename="org-budget-utilization.png">
      <canvas ref={canvasRef} />
    </ChartCard>
  );
}
