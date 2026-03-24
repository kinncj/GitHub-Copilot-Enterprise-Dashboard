import React from 'react';
import { useChart } from './hooks/useChart.js';
import { ChartCard } from './ChartCard.jsx';
import { getChartDefaults } from './chartOptions.js';
import { CONFIG } from '../../domain/config/constants.js';
import { triggerDownload } from '../../../common/utils/download.js';

export function IDEAcceptanceRate({ aggregatedData }) {
  const { byIDE = {} } = aggregatedData;

  const { canvasRef, chartRef } = useChart([JSON.stringify(byIDE)], () => {
    const filtered = Object.entries(byIDE)
      .filter(([, d]) => d.generations >= CONFIG.MIN_GENERATIONS_FOR_RATE)
      .sort((a, b) => {
        const rA = a[1].generations > 0 ? a[1].acceptances / a[1].generations : 0;
        const rB = b[1].generations > 0 ? b[1].acceptances / b[1].generations : 0;
        return rB - rA;
      });

    const labels = filtered.map(([ide]) => ide);
    const data   = filtered.map(([, d]) => d.generations > 0 ? (d.acceptances / d.generations) * 100 : 0);

    const defaults = getChartDefaults();

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Acceptance Rate %', data, backgroundColor: '#818cf8', borderRadius: 4 }]
      },
      options: {
        ...defaults,
        indexAxis: 'y',
        plugins: { ...defaults.plugins, legend: { display: false } },
        scales: {
          x: { ...defaults.scales.x, min: 0, max: 100, ticks: { ...defaults.scales.x.ticks, callback: v => v + '%' } },
          y: defaults.scales.y
        }
      }
    };
  });

  const handleCSV = () => {
    const rows = Object.entries(byIDE)
      .filter(([, d]) => d.generations >= CONFIG.MIN_GENERATIONS_FOR_RATE)
      .map(([ide, d]) => {
        const rate = d.generations > 0 ? ((d.acceptances / d.generations) * 100).toFixed(1) : '0.0';
        return `${ide},${d.generations},${rate}`;
      });
    const csv = 'IDE,Generations,Acceptance Rate%\n' + rows.join('\n');
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'ide-acceptance-rate.csv');
  };

  return (
    <ChartCard title="Acceptance Rate by IDE" subtitle="Which editor drives best acceptance (completions only)" onCSV={handleCSV} chartRef={chartRef} filename="ide-acceptance-rate.png">
      <canvas ref={canvasRef} />
    </ChartCard>
  );
}
