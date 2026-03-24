import React from 'react';
import { useChart } from './hooks/useChart.js';
import { ChartCard } from './ChartCard.jsx';
import { getChartDefaults } from './chartOptions.js';
import { triggerDownload } from '../../../common/utils/download.js';

export function DailyActiveUsers({ aggregatedData }) {
  const { byDay = {} } = aggregatedData;

  const { canvasRef, chartRef } = useChart([JSON.stringify(byDay)], () => {
    const labels = Object.keys(byDay).sort();
    const defaults = getChartDefaults();

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Active Users',
            data: labels.map(d => byDay[d].activeUsers || 0),
            borderColor: '#60a5fa',
            backgroundColor: 'rgba(96,165,250,0.08)',
            borderWidth: 2,
            pointRadius: 2,
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: defaults
    };
  });

  const handleCSV = () => {
    const rows = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b))
      .map(([day, d]) => `${day},${d.activeUsers || 0}`);
    const csv = 'Date,Active Users\n' + rows.join('\n');
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'daily-active-users.csv');
  };

  return (
    <ChartCard title="Daily Active Users" subtitle="Unique users with activity each day" onCSV={handleCSV} chartRef={chartRef} filename="daily-active-users.png">
      <canvas ref={canvasRef} />
    </ChartCard>
  );
}
