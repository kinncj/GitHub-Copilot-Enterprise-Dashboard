import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useChart } from '../hooks/useChart.js';
import { ChartCard } from '../ChartCard.jsx';
import { getChartDefaults } from '../chartOptions.js';
import { triggerDownload } from '../../../../common/utils/download.js';

const pad = n => String(n).padStart(2, '0');

/**
 * Enterprise burn-down: cumulative credits consumed across the month, a dashed
 * run-rate projection from today to month-end, and the flat budget ceiling.
 * Where the projection crosses the ceiling = the budget breach.
 */
export function BudgetProjection() {
  const { aiUsageBudget, aiUsageAggregated } = useApp();
  const ent = aiUsageBudget?.enterprise;
  const byDay = aiUsageAggregated?.byDay || {};

  const { canvasRef, chartRef } = useChart([JSON.stringify(ent), JSON.stringify(byDay)], () => {
    const defaults = getChartDefaults();
    if (!ent) return { type: 'line', data: { labels: [], datasets: [] }, options: defaults };

    const { month, daysInMonth, dayOfMonth, consumed, daysObserved, budget } = ent;
    const rate = daysObserved > 0 ? consumed / daysObserved : 0;

    const labels = [];
    const actual = [];
    const projected = [];
    const ceiling = [];
    let cum = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      labels.push(String(d));
      const key = `${month}-${pad(d)}`;
      if (byDay[key]) cum += byDay[key].credits;
      actual.push(d <= dayOfMonth ? cum : null);
      projected.push(d < dayOfMonth ? null : consumed + rate * (d - dayOfMonth));
      ceiling.push(budget);
    }

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Consumed (cumulative)', data: actual, borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,0.15)', fill: true, tension: 0.2, pointRadius: 0 },
          { label: 'Projected (run rate)', data: projected, borderColor: '#f59e0b', borderDash: [6, 4], fill: false, tension: 0, pointRadius: 0 },
          { label: 'Budget', data: ceiling, borderColor: '#ef4444', borderWidth: 1.5, fill: false, pointRadius: 0 }
        ]
      },
      options: {
        ...defaults,
        scales: {
          ...defaults.scales,
          x: { ...defaults.scales.x, title: { display: true, text: `Day of ${month}` } },
          y: { ...defaults.scales.y, title: { display: true, text: 'Credits (cumulative)' }, beginAtZero: true }
        }
      }
    };
  });

  const handleCSV = () => {
    if (!ent) return;
    const { month, daysInMonth, dayOfMonth, consumed, daysObserved, budget } = ent;
    const rate = daysObserved > 0 ? consumed / daysObserved : 0;
    let cum = 0;
    const rows = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${month}-${pad(d)}`;
      if (byDay[key]) cum += byDay[key].credits;
      const proj = d < dayOfMonth ? '' : (consumed + rate * (d - dayOfMonth)).toFixed(2);
      rows.push(`${key},${d <= dayOfMonth ? cum.toFixed(2) : ''},${proj},${budget}`);
    }
    const csv = 'Date,Consumed,Projected,Budget\n' + rows.join('\n');
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'budget-projection.csv');
  };

  return (
    <ChartCard
      title="Enterprise Budget Burn-Down"
      subtitle="Cumulative credits vs run-rate projection vs monthly budget ceiling"
      onCSV={handleCSV} chartRef={chartRef} filename="budget-projection.png" large>
      <canvas ref={canvasRef} />
    </ChartCard>
  );
}
