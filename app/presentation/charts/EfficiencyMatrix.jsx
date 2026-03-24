import React from 'react';
import { useChart } from './hooks/useChart.js';
import { ChartCard } from './ChartCard.jsx';
import { getChartDefaults } from './chartOptions.js';
import { CONFIG } from '../../domain/config/constants.js';
import { triggerDownload } from '../../../common/utils/download.js';

export function EfficiencyMatrix({ aggregatedData }) {
  const { byUser = {} } = aggregatedData;

  const { canvasRef, chartRef } = useChart([JSON.stringify(byUser)], () => {
    const points = Object.entries(byUser)
      .filter(([, d]) => d.generations >= CONFIG.MIN_GENERATIONS_FOR_RATE)
      .map(([user, d]) => ({
        x: d.generations,
        y: d.generations > 0 ? (d.acceptances / d.generations) * 100 : 0,
        label: user
      }));

    const defaults = getChartDefaults();

    return {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Users',
          data: points,
          backgroundColor: 'rgba(129,140,248,0.6)',
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        ...defaults,
        plugins: {
          ...defaults.plugins,
          tooltip: {
            callbacks: {
              label: ctx => {
                const pt = points[ctx.dataIndex];
                return pt ? `${pt.label}: ${Math.round(ctx.raw.x)} gens, ${ctx.raw.y.toFixed(1)}% accept` : '';
              }
            }
          }
        },
        scales: {
          x: { ...defaults.scales.x, title: { display: true, text: 'Generations', color: 'rgba(255,255,255,0.3)', font: { size: 10 } } },
          y: { ...defaults.scales.y, title: { display: true, text: 'Acceptance Rate %', color: 'rgba(255,255,255,0.3)', font: { size: 10 } }, min: 0, max: 100 }
        }
      }
    };
  });

  const handleCSV = () => {
    const rows = Object.entries(byUser)
      .filter(([, d]) => d.generations >= CONFIG.MIN_GENERATIONS_FOR_RATE)
      .map(([user, d]) => {
        const rate = d.generations > 0 ? ((d.acceptances / d.generations) * 100).toFixed(1) : '0.0';
        return `${user},${d.generations},${rate}`;
      });
    const csv = 'User,Generations,Acceptance Rate%\n' + rows.join('\n');
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'efficiency-matrix.csv');
  };

  return (
    <ChartCard title="User Efficiency Matrix" subtitle={`Generations vs acceptance rate (min ${CONFIG.MIN_GENERATIONS_FOR_RATE} gens)`} onCSV={handleCSV} chartRef={chartRef} filename="efficiency-matrix.png" large>
      <canvas ref={canvasRef} />
    </ChartCard>
  );
}
