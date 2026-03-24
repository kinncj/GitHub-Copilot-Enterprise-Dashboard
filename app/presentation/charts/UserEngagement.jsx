import React from 'react';
import { useChart } from './hooks/useChart.js';
import { ChartCard } from './ChartCard.jsx';
import { getChartDefaults } from './chartOptions.js';
import { triggerDownload } from '../../../common/utils/download.js';

const BUCKETS = [
  { label: '1 day',    min: 1,  max: 1 },
  { label: '2–5 days', min: 2,  max: 5 },
  { label: '6–10',     min: 6,  max: 10 },
  { label: '11–20',    min: 11, max: 20 },
  { label: '21+',      min: 21, max: Infinity }
];

export function UserEngagement({ aggregatedData }) {
  const { byUser = {} } = aggregatedData;

  const { canvasRef, chartRef } = useChart([JSON.stringify(byUser)], () => {
    const counts = BUCKETS.map(b =>
      Object.values(byUser).filter(u => u.days.size >= b.min && u.days.size <= b.max).length
    );

    const defaults = getChartDefaults();

    return {
      type: 'bar',
      data: {
        labels: BUCKETS.map(b => b.label),
        datasets: [{
          label: 'Users',
          data: counts,
          backgroundColor: '#a78bfa',
          borderRadius: 4
        }]
      },
      options: {
        ...defaults,
        plugins: { ...defaults.plugins, legend: { display: false } }
      }
    };
  });

  const handleCSV = () => {
    const counts = BUCKETS.map(b =>
      Object.values(byUser).filter(u => u.days.size >= b.min && u.days.size <= b.max).length
    );
    const csv = 'Days Active,Users\n' + BUCKETS.map((b, i) => `${b.label},${counts[i]}`).join('\n');
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'user-engagement.csv');
  };

  return (
    <ChartCard title="User Engagement Distribution" subtitle="Users grouped by number of active days" onCSV={handleCSV} chartRef={chartRef} filename="user-engagement.png" large>
      <canvas ref={canvasRef} />
    </ChartCard>
  );
}
