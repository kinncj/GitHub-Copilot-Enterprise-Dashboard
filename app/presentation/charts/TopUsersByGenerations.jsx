import React from 'react';
import { useChart } from './hooks/useChart.js';
import { ChartCard } from './ChartCard.jsx';
import { getChartDefaults } from './chartOptions.js';
import { buildTopUsersCSV } from '../../domain/export/csv.js';
import { triggerDownload } from '../../../common/utils/download.js';

const MAX = 15;

export function TopUsersByGenerations({ aggregatedData }) {
  const { byUser = {} } = aggregatedData;

  const { canvasRef, chartRef } = useChart([JSON.stringify(byUser)], () => {
    const sorted = Object.entries(byUser)
      .sort((a, b) => b[1].generations - a[1].generations)
      .slice(0, MAX);

    const labels = sorted.map(([u]) => u);
    const data   = sorted.map(([, d]) => d.generations);
    const colors = sorted.map(([, d]) => {
      const rate = d.generations > 0 ? d.acceptances / d.generations : 0;
      if (rate >= 0.7) return '#34d399';
      if (rate >= 0.2) return '#818cf8';
      return '#f59e0b';
    });

    const defaults = getChartDefaults();

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Generations', data, backgroundColor: colors, borderRadius: 4 }]
      },
      options: {
        ...defaults,
        indexAxis: 'y',
        plugins: { ...defaults.plugins, legend: { display: false } }
      }
    };
  });

  const handleCSV = () => {
    const csv = buildTopUsersCSV(aggregatedData, MAX);
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'top-users-generations.csv');
  };

  return (
    <ChartCard title="Top Users by Generations" subtitle="Color: green = high acceptance, indigo = mid, amber = low" onCSV={handleCSV} chartRef={chartRef} filename="top-users-generations.png" large>
      <canvas ref={canvasRef} />
    </ChartCard>
  );
}
