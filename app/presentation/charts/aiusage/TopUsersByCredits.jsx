import React from 'react';
import { useChart } from '../hooks/useChart.js';
import { ChartCard } from '../ChartCard.jsx';
import { getChartDefaults } from '../chartOptions.js';
import { triggerDownload } from '../../../../common/utils/download.js';
import { CONFIG } from '../../../domain/config/constants.js';

export function TopUsersByCredits({ aggregatedData }) {
  const { byUser = {} } = aggregatedData;

  const { canvasRef, chartRef } = useChart([JSON.stringify(byUser)], () => {
    const sorted = Object.entries(byUser).sort((a, b) => b[1].credits - a[1].credits).slice(0, CONFIG.MAX_TOP_USERS_SHOWN);
    const labels = sorted.map(([u]) => u);
    const data   = sorted.map(([, u]) => u.credits);
    const defaults = getChartDefaults();

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'AI Credits', data, backgroundColor: 'rgba(129,140,248,0.65)', borderColor: '#818cf8', borderWidth: 1 }]
      },
      options: {
        ...defaults,
        indexAxis: 'y',
        plugins: { ...defaults.plugins, legend: { display: false } }
      }
    };
  });

  const handleCSV = () => {
    const rows = Object.entries(byUser).sort((a, b) => b[1].credits - a[1].credits)
      .map(([u, d]) => `${u},${d.credits.toFixed(2)},${d.gross.toFixed(4)}`);
    const csv = 'User,Credits,Gross\n' + rows.join('\n');
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'top-users-by-credits.csv');
  };

  return (
    <ChartCard title="Top Users by Credits" subtitle="Biggest AI-credit consumers" onCSV={handleCSV} chartRef={chartRef} filename="top-users-by-credits.png">
      <canvas ref={canvasRef} />
    </ChartCard>
  );
}
