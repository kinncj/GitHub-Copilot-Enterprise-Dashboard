import React from 'react';
import { useChart } from './hooks/useChart.js';
import { ChartCard } from './ChartCard.jsx';
import { getChartDefaults } from './chartOptions.js';
import { humanizeFeature } from '../../../common/utils/format.js';
import { buildFeatureAdoptionCSV } from '../../domain/export/csv.js';
import { triggerDownload } from '../../../common/utils/download.js';

const COLORS = ['#818cf8', '#34d399', '#f59e0b', '#60a5fa', '#a78bfa', '#f87171', '#fb923c', '#4ade80'];

export function FeatureUsage({ aggregatedData }) {
  const { byFeature = {} } = aggregatedData;

  const { canvasRef, chartRef } = useChart([JSON.stringify(byFeature)], () => {
    const sorted = Object.entries(byFeature).sort((a, b) => b[1].generations - a[1].generations);
    const labels = sorted.map(([key]) => humanizeFeature(key).short);
    const data   = sorted.map(([, d]) => d.generations);
    const fullLabels = sorted.map(([key]) => humanizeFeature(key).label);

    const defaults = getChartDefaults();

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Generations',
          data,
          backgroundColor: sorted.map((_, i) => COLORS[i % COLORS.length]),
          borderRadius: 4
        }]
      },
      options: {
        ...defaults,
        plugins: {
          ...defaults.plugins,
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: items => fullLabels[items[0].dataIndex] || items[0].label
            }
          }
        }
      }
    };
  });

  const handleCSV = () => {
    const csv = buildFeatureAdoptionCSV(aggregatedData);
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'feature-usage.csv');
  };

  return (
    <ChartCard title="Feature Usage" subtitle="Generations by Copilot feature" onCSV={handleCSV} chartRef={chartRef} filename="feature-usage.png">
      <canvas ref={canvasRef} />
    </ChartCard>
  );
}
