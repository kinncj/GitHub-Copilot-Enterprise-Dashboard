import React from 'react';
import { useChart } from './hooks/useChart.js';
import { ChartCard } from './ChartCard.jsx';
import { getChartDefaults, getChartColors } from './chartOptions.js';
import { buildActivityChartCSV } from '../../domain/export/csv.js';
import { triggerDownload } from '../../../common/utils/download.js';
import { deepMerge } from './utils.js';

export function ActivityTimeline({ aggregatedData }) {
  const { byDay = {} } = aggregatedData;

  const { canvasRef, chartRef } = useChart([JSON.stringify(byDay)], () => {
    const labels = Object.keys(byDay).sort();
    const defaults = getChartDefaults();
    const c = getChartColors();

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Generations',
            data: labels.map(d => byDay[d].generations),
            borderColor: '#818cf8',
            backgroundColor: 'rgba(129,140,248,0.08)',
            borderWidth: 2,
            pointRadius: 2,
            tension: 0.3,
            yAxisID: 'y'
          },
          {
            label: 'Chat',
            data: labels.map(d => byDay[d].chatCount || 0),
            borderColor: '#34d399',
            backgroundColor: 'rgba(52,211,153,0.08)',
            borderWidth: 2,
            pointRadius: 2,
            tension: 0.3,
            yAxisID: 'y'
          },
          {
            label: 'Lines Added',
            data: labels.map(d => byDay[d].linesAdded),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245,158,11,0.06)',
            borderWidth: 1.5,
            pointRadius: 1,
            tension: 0.3,
            yAxisID: 'y1'
          },
          {
            label: 'Lines Deleted',
            data: labels.map(d => byDay[d].linesDeleted),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239,68,68,0.06)',
            borderWidth: 1.5,
            pointRadius: 1,
            tension: 0.3,
            yAxisID: 'y1'
          }
        ]
      },
      options: deepMerge(defaults, {
        plugins: { legend: { display: true } },
        scales: {
          y: { ...defaults.scales.y, position: 'left', title: { display: true, text: 'Activity', color: c.axisTitle, font: { size: 10 } } },
          y1: { ...defaults.scales.y, position: 'right', grid: { drawOnChartArea: false, color: c.grid }, title: { display: true, text: 'Lines', color: c.axisTitle, font: { size: 10 } } }
        }
      })
    };
  });

  const handleCSV = () => {
    const csv = buildActivityChartCSV(aggregatedData);
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'activity-timeline.csv');
  };

  return (
    <ChartCard title="Activity Timeline" subtitle="Generations, chat, and lines of code over time" onCSV={handleCSV} chartRef={chartRef} filename="activity-timeline.png" large>
      <canvas ref={canvasRef} />
    </ChartCard>
  );
}
