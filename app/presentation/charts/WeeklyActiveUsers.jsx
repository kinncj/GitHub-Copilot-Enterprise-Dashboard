import React from 'react';
import { useChart } from './hooks/useChart.js';
import { ChartCard } from './ChartCard.jsx';
import { getChartDefaults } from './chartOptions.js';
import { triggerDownload } from '../../../common/utils/download.js';

export function WeeklyActiveUsers({ aggregatedData }) {
  const { byWeek = {} } = aggregatedData;

  const { canvasRef, chartRef } = useChart([JSON.stringify(byWeek)], () => {
    const labels = Object.keys(byWeek).sort();
    const defaults = getChartDefaults();

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Active Users',
            data: labels.map(w => byWeek[w].activeUsers || 0),
            backgroundColor: 'rgba(96,165,250,0.7)',
            borderColor: '#60a5fa',
            borderWidth: 1,
            borderRadius: 3
          }
        ]
      },
      options: {
        ...defaults,
        plugins: { ...defaults.plugins, legend: { display: false } }
      }
    };
  });

  const handleCSV = () => {
    const rows = Object.entries(byWeek).sort(([a], [b]) => a.localeCompare(b))
      .map(([week, d]) => `${week},${d.activeUsers || 0}`);
    const csv = 'Week (Monday),Active Users\n' + rows.join('\n');
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'weekly-active-users.csv');
  };

  return (
    <ChartCard title="Weekly Active Users" subtitle="Unique users with activity per week (Monday start)" onCSV={handleCSV} chartRef={chartRef} filename="weekly-active-users.png">
      <canvas ref={canvasRef} />
    </ChartCard>
  );
}
