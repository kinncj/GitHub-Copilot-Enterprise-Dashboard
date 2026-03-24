import React from 'react';
import { useChart } from './hooks/useChart.js';
import { ChartCard } from './ChartCard.jsx';
import { getChartDefaults } from './chartOptions.js';
import { CONFIG } from '../../domain/config/constants.js';
import { triggerDownload } from '../../../common/utils/download.js';

const MAX = 15;

export function LanguageAcceptanceRate({ aggregatedData }) {
  const { byLanguage = {} } = aggregatedData;

  const { canvasRef, chartRef } = useChart([JSON.stringify(byLanguage)], () => {
    const filtered = Object.entries(byLanguage)
      .filter(([, d]) => d.generations >= CONFIG.MIN_GENERATIONS_FOR_RATE)
      .sort((a, b) => {
        const rA = a[1].generations > 0 ? a[1].acceptances / a[1].generations : 0;
        const rB = b[1].generations > 0 ? b[1].acceptances / b[1].generations : 0;
        return rB - rA;
      })
      .slice(0, MAX);

    const labels = filtered.map(([lang]) => lang);
    const data   = filtered.map(([, d]) => d.generations > 0 ? (d.acceptances / d.generations) * 100 : 0);

    const defaults = getChartDefaults();

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Acceptance Rate %', data, backgroundColor: '#34d399', borderRadius: 4 }]
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
    const rows = Object.entries(byLanguage)
      .filter(([, d]) => d.generations >= CONFIG.MIN_GENERATIONS_FOR_RATE)
      .map(([lang, d]) => {
        const rate = d.generations > 0 ? ((d.acceptances / d.generations) * 100).toFixed(1) : '0.0';
        return `${lang},${d.generations},${rate}`;
      });
    const csv = 'Language,Generations,Acceptance Rate%\n' + rows.join('\n');
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'language-acceptance-rate.csv');
  };

  return (
    <ChartCard title="Acceptance Rate by Language" subtitle="Which languages benefit most from Copilot completions" onCSV={handleCSV} chartRef={chartRef} filename="language-acceptance-rate.png">
      <canvas ref={canvasRef} />
    </ChartCard>
  );
}
