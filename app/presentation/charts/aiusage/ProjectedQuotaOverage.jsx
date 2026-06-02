import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useChart } from '../hooks/useChart.js';
import { ChartCard } from '../ChartCard.jsx';
import { getChartDefaults } from '../chartOptions.js';
import { triggerDownload } from '../../../../common/utils/download.js';
import { CONFIG } from '../../../domain/config/constants.js';

/**
 * Users ranked by projected month-end consumption as a % of their individual
 * monthly quota. Red = projected to exceed quota. Surfaces who to talk to
 * before the budget is blown.
 */
export function ProjectedQuotaOverage() {
  const { aiUsageBudget } = useApp();
  const byUser = aiUsageBudget?.byUser || {};

  const { canvasRef, chartRef } = useChart([JSON.stringify(byUser)], () => {
    const rows = Object.entries(byUser)
      .filter(([, u]) => u.budget > 0)
      .map(([user, u]) => ({ user, pct: u.projectedPct * 100 }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, CONFIG.MAX_TOP_USERS_SHOWN);

    const labels = rows.map(r => r.user);
    const data   = rows.map(r => +r.pct.toFixed(1));
    const colors = rows.map(r => r.pct > 100 ? 'rgba(239,68,68,0.75)'
      : r.pct >= CONFIG.NEAR_QUOTA_THRESHOLD * 100 ? 'rgba(245,158,11,0.7)' : 'rgba(52,211,153,0.6)');
    const defaults = getChartDefaults();

    return {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Projected % of quota', data, backgroundColor: colors, borderWidth: 0 }] },
      options: {
        ...defaults,
        indexAxis: 'y',
        plugins: { ...defaults.plugins, legend: { display: false } },
        scales: { ...defaults.scales, x: { ...defaults.scales.x, title: { display: true, text: 'projected % of quota' }, beginAtZero: true } }
      }
    };
  });

  const handleCSV = () => {
    const rows = Object.entries(byUser).filter(([, u]) => u.budget > 0)
      .sort((a, b) => b[1].projectedPct - a[1].projectedPct)
      .map(([user, u]) => `${user},${u.consumed.toFixed(2)},${u.budget},${u.projected.toFixed(2)},${(u.projectedPct * 100).toFixed(1)}%`);
    const csv = 'User,Credits Used,Credits Allotted,Projected,Projected %\n' + rows.join('\n');
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'projected-quota-overage.csv');
  };

  return (
    <ChartCard
      title="Projected Quota Overage (Users)"
      subtitle="Run-rate projection vs each user's monthly quota — red = projected over 100%"
      onCSV={handleCSV} chartRef={chartRef} filename="projected-quota-overage.png">
      <canvas ref={canvasRef} />
    </ChartCard>
  );
}
