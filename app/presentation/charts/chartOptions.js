export function getChartDefaults() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 750 },
    plugins: {
      legend: {
        labels: {
          color: 'rgba(255,255,255,0.32)',
          font: { size: 11, family: 'Inter' },
          boxWidth: 10
        }
      }
    },
    scales: {
      y: {
        ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 11 } },
        grid: { color: 'rgba(255,255,255,0.04)' },
        border: { color: 'transparent' }
      },
      x: {
        ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 11 } },
        grid: { color: 'rgba(255,255,255,0.04)' },
        border: { color: 'transparent' }
      }
    }
  };
}
