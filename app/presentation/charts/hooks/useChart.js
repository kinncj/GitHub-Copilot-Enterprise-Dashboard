import { useRef, useEffect, useState } from 'react';
import Chart from 'chart.js/auto';

function useColorScheme() {
  const [scheme, setScheme] = useState(
    () => document.documentElement.getAttribute('data-mantine-color-scheme') || 'dark'
  );
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setScheme(document.documentElement.getAttribute('data-mantine-color-scheme') || 'dark');
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mantine-color-scheme'] });
    return () => obs.disconnect();
  }, []);
  return scheme;
}

export function useChart(deps, buildConfig) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const scheme = useColorScheme();

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current, buildConfig());
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [...deps, scheme]); // eslint-disable-line react-hooks/exhaustive-deps

  return { canvasRef, chartRef };
}
