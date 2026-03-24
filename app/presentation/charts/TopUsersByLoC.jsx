import React from 'react';
import { useChart } from './hooks/useChart.js';
import { ChartCard } from './ChartCard.jsx';
import { getChartDefaults } from './chartOptions.js';
import { triggerDownload } from '../../../common/utils/download.js';

const MAX = 15;

export function TopUsersByLoC({ aggregatedData }) {
  const { byUser = {} } = aggregatedData;

  const { canvasRef, chartRef } = useChart([JSON.stringify(byUser)], () => {
    const sorted = Object.entries(byUser)
      .sort((a, b) => b[1].linesAdded - a[1].linesAdded)
      .slice(0, MAX);

    const labels = sorted.map(([u]) => u);
    const data   = sorted.map(([, d]) => d.linesAdded);

    const defaults = getChartDefaults();

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Lines Added', data, backgroundColor: '#34d399', borderRadius: 4 }]
      },
      options: {
        ...defaults,
        indexAxis: 'y',
        plugins: { ...defaults.plugins, legend: { display: false } }
      }
    };
  });

  const handleCSV = () => {
    const rows = Object.entries(byUser)
      .sort((a, b) => b[1].linesAdded - a[1].linesAdded)
      .slice(0, MAX)
      .map(([user, d]) => `${user},${d.linesAdded},${d.linesDeleted}`);
    const csv = 'User,Lines Added,Lines Deleted\n' + rows.join('\n');
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'top-users-loc.csv');
  };

  return (
    <ChartCard title="Top Users by Lines Added" subtitle="Top 15 users by lines of code added" onCSV={handleCSV} chartRef={chartRef} filename="top-users-loc.png" large>
      <canvas ref={canvasRef} />
    </ChartCard>
  );
}
