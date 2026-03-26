import React from 'react';
import { useChart } from './hooks/useChart.js';
import { ChartCard } from './ChartCard.jsx';
import { getChartDefaults } from './chartOptions.js';
import { triggerDownload } from '../../../common/utils/download.js';

export function DailyLinesChanged({ aggregatedData }) {
  const { byDay = {} } = aggregatedData;

  const { canvasRef, chartRef } = useChart([JSON.stringify(byDay)], () => {
    const labels = Object.keys(byDay).sort();
    const defaults = getChartDefaults();

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Lines Added',
            data: labels.map(d => byDay[d].linesAdded),
            backgroundColor: 'rgba(52,211,153,0.75)',
            borderColor: '#34d399',
            borderWidth: 1,
            borderRadius: 2
          },
          {
            label: 'Lines Deleted',
            data: labels.map(d => byDay[d].linesDeleted),
            backgroundColor: 'rgba(239,68,68,0.6)',
            borderColor: '#ef4444',
            borderWidth: 1,
            borderRadius: 2
          }
        ]
      },
      options: {
        ...defaults,
        plugins: { ...defaults.plugins, legend: { display: true } }
      }
    };
  });

  const handleCSV = () => {
    const rows = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b))
      .map(([day, d]) => `${day},${d.linesAdded},${d.linesDeleted},${d.linesAdded + d.linesDeleted}`);
    const csv = 'Date,Lines Added,Lines Deleted,Lines Changed\n' + rows.join('\n');
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'daily-lines-changed.csv');
  };

  return (
    <ChartCard title="Daily Lines Changed with AI" subtitle="Lines added and deleted per day across all modes" onCSV={handleCSV} chartRef={chartRef} filename="daily-lines-changed.png" large>
      <canvas ref={canvasRef} />
    </ChartCard>
  );
}
