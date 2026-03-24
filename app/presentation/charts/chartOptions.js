function isDark() {
  if (typeof document === 'undefined') return true;
  return document.documentElement.getAttribute('data-mantine-color-scheme') !== 'light';
}

export function getChartColors() {
  const dark = isDark();
  return {
    tick:      dark ? 'rgba(255,255,255,0.3)'  : 'rgba(0,0,0,0.45)',
    grid:      dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.07)',
    legend:    dark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.55)',
    axisTitle: dark ? 'rgba(255,255,255,0.3)'  : 'rgba(0,0,0,0.45)',
  };
}

export function getChartDefaults() {
  const c = getChartColors();
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 750 },
    plugins: {
      legend: {
        labels: {
          color: c.legend,
          font: { size: 11, family: 'Inter' },
          boxWidth: 10
        }
      }
    },
    scales: {
      y: {
        ticks: { color: c.tick, font: { size: 11 } },
        grid: { color: c.grid },
        border: { color: 'transparent' }
      },
      x: {
        ticks: { color: c.tick, font: { size: 11 } },
        grid: { color: c.grid },
        border: { color: 'transparent' }
      }
    }
  };
}
