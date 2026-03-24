import React from 'react';
import { triggerDownloadFromDataUrl } from '../../../common/utils/download.js';

export function ChartCard({ title, subtitle, onCSV, chartRef, filename, large, children }) {
  const handlePNG = () => {
    if (!chartRef?.current) return;
    const canvas = chartRef.current.canvas;
    const out = document.createElement('canvas');
    out.width = canvas.width;
    out.height = canvas.height;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, 0, 0);
    triggerDownloadFromDataUrl(out.toDataURL('image/png'), filename || 'chart.png');
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-1)' }}>{title}</h3>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{subtitle}</p>}
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {onCSV && <button className="btn-secondary text-xs" onClick={onCSV}>CSV</button>}
          <button className="btn-secondary text-xs" onClick={handlePNG}>PNG</button>
        </div>
      </div>
      <div className={large ? 'chart-container-large' : 'chart-container'}>
        {children}
      </div>
    </div>
  );
}
