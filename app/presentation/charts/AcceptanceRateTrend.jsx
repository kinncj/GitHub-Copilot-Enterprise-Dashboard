import React from 'react';
import { useChart } from './hooks/useChart.js';
import { ChartCard } from './ChartCard.jsx';
import { getChartDefaults } from './chartOptions.js';
import { triggerDownload } from '../../../common/utils/download.js';

export function AcceptanceRateTrend({ aggregatedData }) {
  const { byDay = {} } = aggregatedData;

  const { canvasRef, chartRef } = useChart([JSON.stringify(byDay)], () => {
    const labels = Object.keys(byDay).sort();
    const rates = labels.map(d => {
      const day = byDay[d];
      return day.generations > 0 ? (day.acceptances / day.generations) * 100 : null;
    });

    // 7-day moving average
    const movingAvg = rates.map((_, i) => {
      const window = rates.slice(Math.max(0, i - 6), i + 1).filter(v => v !== null);
      return window.length > 0 ? window.reduce((s, v) => s + v, 0) / window.length : null;
    });

    const defaults = getChartDefaults();

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Daily Rate',
            data: rates,
            borderColor: '#818cf8',
            backgroundColor: 'rgba(129,140,248,0.06)',
            borderWidth: 1.5,
            pointRadius: 2,
            tension: 0.2,
            spanGaps: true
          },
          {
            label: '7-Day Avg',
            data: movingAvg,
            borderColor: '#34d399',
            borderWidth: 2.5,
            pointRadius: 0,
            tension: 0.4,
            spanGaps: true
          }
        ]
      },
      options: {
        ...defaults,
        scales: {
          ...defaults.scales,
          y: {
            ...defaults.scales.y,
            min: 0,
            max: 100,
            ticks: { ...defaults.scales.y.ticks, callback: v => v + '%' }
          }
        }
      }
    };
  });

  const handleCSV = () => {
    const rows = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b))
      .map(([day, d]) => {
        const rate = d.generations > 0 ? ((d.acceptances / d.generations) * 100).toFixed(1) : '';
        return `${day},${d.generations},${d.acceptances},${rate}`;
      });
    const csv = 'Date,Generations,Acceptances,Rate%\n' + rows.join('\n');
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'acceptance-rate-trend.csv');
  };

  return (
    <ChartCard title="Acceptance Rate Trend" subtitle="Daily rate and 7-day moving average (completions only)" onCSV={handleCSV} chartRef={chartRef} filename="acceptance-rate-trend.png">
      <canvas ref={canvasRef} />
    </ChartCard>
  );
}
