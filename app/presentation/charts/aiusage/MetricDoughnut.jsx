import React from 'react';
import { useChart } from '../hooks/useChart.js';
import { ChartCard } from '../ChartCard.jsx';
import { getChartDefaults } from '../chartOptions.js';
import { triggerDownload } from '../../../../common/utils/download.js';

const COLORS = ['#818cf8', '#34d399', '#f59e0b', '#60a5fa', '#a78bfa', '#f87171', '#fb923c', '#4ade80', '#22d3ee', '#e879f9'];

/**
 * Generic doughnut for an AI-usage breakdown bucket
 * (Object.<key, {credits, gross, ...}>). Sorts by the chosen metric.
 */
export function MetricDoughnut({ title, subtitle, bucket = {}, metric = 'credits', filename }) {
  const { canvasRef, chartRef } = useChart([JSON.stringify(bucket), metric], () => {
    const sorted = Object.entries(bucket).sort((a, b) => b[1][metric] - a[1][metric]);
    const labels = sorted.map(([k]) => k);
    const data   = sorted.map(([, v]) => +v[metric].toFixed(2));
    const defaults = getChartDefaults();

    return {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: COLORS.slice(0, labels.length || 1),
          borderColor: '#111111',
          borderWidth: 2
        }]
      },
      options: { ...defaults, cutout: '62%', scales: {} }
    };
  });

  const handleCSV = () => {
    const rows = Object.entries(bucket).sort((a, b) => b[1][metric] - a[1][metric])
      .map(([k, v]) => `${k},${(v.credits ?? 0).toFixed(2)},${(v.gross ?? 0).toFixed(4)}`);
    const csv = 'Key,Credits,Gross\n' + rows.join('\n');
    triggerDownload(new Blob([csv], { type: 'text/csv' }), (filename || 'breakdown') + '.csv');
  };

  return (
    <ChartCard title={title} subtitle={subtitle} onCSV={handleCSV} chartRef={chartRef} filename={(filename || 'breakdown') + '.png'}>
      <canvas ref={canvasRef} />
    </ChartCard>
  );
}
