import React from 'react';
import { useChart } from './hooks/useChart.js';
import { ChartCard } from './ChartCard.jsx';
import { getChartDefaults } from './chartOptions.js';
import { CONFIG } from '../../domain/config/constants.js';
import { triggerDownload } from '../../../common/utils/download.js';

const COLORS = ['#818cf8', '#34d399', '#f59e0b', '#60a5fa', '#a78bfa', '#f87171', '#fb923c', '#4ade80', '#f472b6', '#22d3ee'];

export function LanguageDistribution({ aggregatedData }) {
  const { byLanguage = {} } = aggregatedData;

  const { canvasRef, chartRef } = useChart([JSON.stringify(byLanguage)], () => {
    const sorted = Object.entries(byLanguage).sort((a, b) => b[1].generations - a[1].generations);
    const top    = sorted.slice(0, CONFIG.MAX_LANGUAGES_SHOWN);
    const other  = sorted.slice(CONFIG.MAX_LANGUAGES_SHOWN);
    const otherSum = other.reduce((s, [, d]) => s + d.generations, 0);

    const labels = top.map(([lang]) => lang);
    const data   = top.map(([, d]) => d.generations);
    if (otherSum > 0) { labels.push('Other'); data.push(otherSum); }

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
      options: { ...defaults, cutout: '62%', scales: {} }
    };
  });

  const handleCSV = () => {
    const rows = Object.entries(byLanguage).sort((a, b) => b[1].generations - a[1].generations)
      .map(([lang, d]) => `${lang},${d.generations}`);
    const csv = 'Language,Generations\n' + rows.join('\n');
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'language-distribution.csv');
  };

  return (
    <ChartCard title="Language Distribution" subtitle={`Top ${CONFIG.MAX_LANGUAGES_SHOWN} languages + Other`} onCSV={handleCSV} chartRef={chartRef} filename="language-distribution.png">
      <canvas ref={canvasRef} />
    </ChartCard>
  );
}
