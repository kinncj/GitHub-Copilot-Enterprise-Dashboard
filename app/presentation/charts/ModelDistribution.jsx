import React from 'react';
import { useChart } from './hooks/useChart.js';
import { ChartCard } from './ChartCard.jsx';
import { getChartDefaults } from './chartOptions.js';
import { triggerDownload } from '../../../common/utils/download.js';

const COLORS = ['#818cf8', '#34d399', '#f59e0b', '#60a5fa', '#a78bfa', '#f87171', '#fb923c', '#4ade80'];

export function ModelDistribution({ aggregatedData }) {
  const { byModel = {} } = aggregatedData;

  const { canvasRef, chartRef } = useChart([JSON.stringify(byModel)], () => {
    const sorted = Object.entries(byModel).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(([model]) => model);
    const data   = sorted.map(([, v]) => v);

    const defaults = getChartDefaults();

    return {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: COLORS.slice(0, labels.length),
          borderColor: '#111111',
          borderWidth: 2
        }]
      },
      options: { ...defaults, scales: {} }
    };
  });

  const handleCSV = () => {
    const rows = Object.entries(byModel).sort((a, b) => b[1] - a[1])
      .map(([model, v]) => `${model},${v}`);
    const csv = 'Model,Generations\n' + rows.join('\n');
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'model-distribution.csv');
  };

  return (
    <ChartCard title="Model Distribution" subtitle="Generations by AI model" onCSV={handleCSV} chartRef={chartRef} filename="model-distribution.png">
      <canvas ref={canvasRef} />
    </ChartCard>
  );
}
