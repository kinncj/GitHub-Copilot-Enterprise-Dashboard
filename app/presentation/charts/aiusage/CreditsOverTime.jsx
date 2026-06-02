import React from 'react';
import { useChart } from '../hooks/useChart.js';
import { ChartCard } from '../ChartCard.jsx';
import { getChartDefaults } from '../chartOptions.js';
import { triggerDownload } from '../../../../common/utils/download.js';

export function CreditsOverTime({ aggregatedData }) {
  const { byDay = {} } = aggregatedData;

  const { canvasRef, chartRef } = useChart([JSON.stringify(byDay)], () => {
    const days = Object.keys(byDay).sort();
    const credits = days.map(d => byDay[d].credits);
    const gross   = days.map(d => byDay[d].gross);
    const defaults = getChartDefaults();

    return {
      type: 'bar',
      data: {
        labels: days,
        datasets: [
          {
            type: 'bar',
            label: 'AI Credits',
            data: credits,
            backgroundColor: 'rgba(129,140,248,0.55)',
            borderColor: '#818cf8',
            borderWidth: 1,
            yAxisID: 'y'
          },
          {
            type: 'line',
            label: 'Gross $',
            data: gross,
            borderColor: '#34d399',
            backgroundColor: 'rgba(52,211,153,0.15)',
            tension: 0.3,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        ...defaults,
        scales: {
          ...defaults.scales,
          y:  { ...defaults.scales.y, position: 'left',  title: { display: true, text: 'Credits' } },
          y1: { ...defaults.scales.y, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Gross $' } }
        }
      }
    };
  });

  const handleCSV = () => {
    const rows = Object.keys(byDay).sort().map(d => `${d},${byDay[d].credits.toFixed(2)},${byDay[d].gross.toFixed(4)}`);
    const csv = 'Date,Credits,Gross\n' + rows.join('\n');
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'credits-over-time.csv');
  };

  return (
    <ChartCard title="Credits & Cost Over Time" subtitle="Daily AI-credit consumption and gross $ value" onCSV={handleCSV} chartRef={chartRef} filename="credits-over-time.png">
      <canvas ref={canvasRef} />
    </ChartCard>
  );
}
