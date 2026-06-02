import React from 'react';
import { useChart } from '../hooks/useChart.js';
import { ChartCard } from '../ChartCard.jsx';
import { getChartDefaults } from '../chartOptions.js';
import { triggerDownload } from '../../../../common/utils/download.js';
import { CONFIG } from '../../../domain/config/constants.js';

export function QuotaUtilization({ aggregatedData }) {
  const { byUser = {} } = aggregatedData;

  const { canvasRef, chartRef } = useChart([JSON.stringify(byUser)], () => {
    const rows = Object.entries(byUser)
      .filter(([, u]) => u.quota > 0)
      .map(([u, d]) => ({ user: u, pct: (d.credits / d.quota) * 100 }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, CONFIG.MAX_TOP_USERS_SHOWN);

    const labels = rows.map(r => r.user);
    const data   = rows.map(r => +r.pct.toFixed(1));
    const colors = rows.map(r => r.pct >= CONFIG.NEAR_QUOTA_THRESHOLD * 100 ? 'rgba(248,113,113,0.7)' : 'rgba(52,211,153,0.6)');
    const defaults = getChartDefaults();

    return {
      type: 'bar',
      data: { labels, datasets: [{ label: '% of Monthly Quota', data, backgroundColor: colors, borderWidth: 0 }] },
      options: {
        ...defaults,
        indexAxis: 'y',
        plugins: { ...defaults.plugins, legend: { display: false } },
        scales: { ...defaults.scales, x: { ...defaults.scales.x, title: { display: true, text: '% of quota' } } }
      }
    };
  });

  const handleCSV = () => {
    const rows = Object.entries(byUser).filter(([, u]) => u.quota > 0)
      .map(([u, d]) => `${u},${d.credits.toFixed(2)},${d.quota},${((d.credits / d.quota) * 100).toFixed(1)}%`)
      .sort();
    const csv = 'User,Credits,Quota,% of Quota\n' + rows.join('\n');
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'quota-utilization.csv');
  };

  return (
    <ChartCard title="Quota Utilization" subtitle="Credits used as % of each user's monthly quota (red = near/over)" onCSV={handleCSV} chartRef={chartRef} filename="quota-utilization.png">
      <canvas ref={canvasRef} />
    </ChartCard>
  );
}
