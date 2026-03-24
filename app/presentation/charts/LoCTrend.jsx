import React from 'react';
import { useChart } from './hooks/useChart.js';
import { ChartCard } from './ChartCard.jsx';
import { getChartDefaults } from './chartOptions.js';
import { triggerDownload } from '../../../common/utils/download.js';

export function LoCTrend({ aggregatedData }) {
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
            label: 'Lines Added',
            data: labels.map(d => byDay[d].linesAdded),
            borderColor: '#34d399',
            backgroundColor: 'rgba(52,211,153,0.08)',
            borderWidth: 2,
            pointRadius: 2,
            tension: 0.3,
            fill: true
          },
          {
            label: 'Lines Deleted',
            data: labels.map(d => byDay[d].linesDeleted),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239,68,68,0.06)',
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
      .map(([day, d]) => `${day},${d.linesAdded},${d.linesDeleted}`);
    const csv = 'Date,Lines Added,Lines Deleted\n' + rows.join('\n');
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'loc-trend.csv');
  };

  return (
    <ChartCard title="Lines of Code Trend" subtitle="Lines added and deleted over time" onCSV={handleCSV} chartRef={chartRef} filename="loc-trend.png">
      <canvas ref={canvasRef} />
    </ChartCard>
  );
}
