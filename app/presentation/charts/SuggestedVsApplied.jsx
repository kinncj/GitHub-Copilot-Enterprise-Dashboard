import React from 'react';
import { useChart } from './hooks/useChart.js';
import { ChartCard } from './ChartCard.jsx';
import { getChartDefaults } from './chartOptions.js';
import { triggerDownload } from '../../../common/utils/download.js';

export function SuggestedVsApplied({ aggregatedData }) {
  const { byDay = {} } = aggregatedData;

  // Only render if we have any suggestion data — older exports may not include it
  const hasSuggested = Object.values(byDay).some(d => (d.locSuggested || 0) > 0);

  const { canvasRef, chartRef } = useChart([JSON.stringify(byDay)], () => {
    const labels = Object.keys(byDay).sort();
    const defaults = getChartDefaults();

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Suggested',
            data: labels.map(d => byDay[d].locSuggested || 0),
            borderColor: '#818cf8',
            backgroundColor: 'rgba(129,140,248,0.08)',
            borderWidth: 2,
            pointRadius: 2,
            tension: 0.3,
            fill: true
          },
          {
            label: 'Applied',
            data: labels.map(d => byDay[d].linesAdded),
            borderColor: '#34d399',
            backgroundColor: 'rgba(52,211,153,0.1)',
            borderWidth: 2,
            pointRadius: 2,
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        ...defaults,
        plugins: { ...defaults.plugins, legend: { display: true } }
      }
    };
  });

  const handleCSV = () => {
    const rows = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b))
      .map(([day, d]) => {
        const suggested = d.locSuggested || 0;
        const applied = d.linesAdded;
        const rate = suggested > 0 ? ((applied / suggested) * 100).toFixed(1) : '';
        return `${day},${suggested},${applied},${rate}`;
      });
    const csv = 'Date,Suggested,Applied,Accept Rate %\n' + rows.join('\n');
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'suggested-vs-applied.csv');
  };

  if (!hasSuggested) {
    return (
      <ChartCard title="Suggested vs Applied" subtitle="Requires loc_suggested_to_add_sum in the export" chartRef={chartRef} filename="suggested-vs-applied.png">
        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--text-3)',fontSize:'0.8rem' }}>
          No suggestion data in this export
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Suggested vs Applied" subtitle="Lines Copilot offered vs lines actually kept" onCSV={handleCSV} chartRef={chartRef} filename="suggested-vs-applied.png">
      <canvas ref={canvasRef} />
    </ChartCard>
  );
}
