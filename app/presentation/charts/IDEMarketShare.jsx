import React from 'react';
import { useChart } from './hooks/useChart.js';
import { ChartCard } from './ChartCard.jsx';
import { getChartDefaults } from './chartOptions.js';
import { triggerDownload } from '../../../common/utils/download.js';

const COLORS = ['#818cf8', '#34d399', '#f59e0b', '#60a5fa', '#a78bfa', '#f87171', '#fb923c', '#4ade80'];

export function IDEMarketShare({ aggregatedData }) {
  const { byIDE = {} } = aggregatedData;

  const { canvasRef, chartRef } = useChart([JSON.stringify(byIDE)], () => {
    const sorted = Object.entries(byIDE).sort((a, b) => b[1].generations - a[1].generations);
    const labels = sorted.map(([ide]) => ide);
    const data   = sorted.map(([, d]) => d.generations);

    const defaults = getChartDefaults();

    return {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: COLORS.slice(0, labels.length),
          borderColor: '#111111',
          borderWidth: 2
        }]
      },
      options: {
        ...defaults,
        cutout: '62%',
        scales: {}
      }
    };
  });

  const handleCSV = () => {
    const rows = Object.entries(byIDE).sort((a, b) => b[1].generations - a[1].generations)
      .map(([ide, d]) => `${ide},${d.generations}`);
    const csv = 'IDE,Generations\n' + rows.join('\n');
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'ide-market-share.csv');
  };

  return (
    <ChartCard title="IDE Market Share" subtitle="Share of generations by IDE" onCSV={handleCSV} chartRef={chartRef} filename="ide-market-share.png">
      <canvas ref={canvasRef} />
    </ChartCard>
  );
}
