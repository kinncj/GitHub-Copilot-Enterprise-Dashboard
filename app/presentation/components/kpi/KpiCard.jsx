import React, { useState, useRef } from 'react';
import { Info } from 'lucide-react';
import { triggerDownload, captureElementAsPng } from '../../../../common/utils/download.js';

export function KpiCard({ label, value, subtitle, description, tooltip }) {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef(null);
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const handleCSV = e => {
    e.stopPropagation();
    const csv = `Label,Value,Subtitle\n"${label}","${value}","${subtitle || ''}"`;
    triggerDownload(new Blob([csv], { type: 'text/csv' }), `kpi-${slug}.csv`);
  };

  const handlePng = e => {
    e.stopPropagation();
    captureElementAsPng(cardRef.current, `kpi-${slug}.png`);
  };

  return (
    <div
      className="kpi-card"
      ref={cardRef}
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'0.6rem' }}>
        <span style={{ fontSize:'0.7rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.09em',color:'var(--text-2)' }}>{label}</span>
        {tooltip && (
          <span className="info-tip">
            <Info size={12} />
            <span className="tip-body">{tooltip}</span>
          </span>
        )}
      </div>
      {description && <div style={{ fontSize:'0.68rem',marginBottom:'0.5rem',color:'var(--text-2)' }}>{description}</div>}
      <div style={{ fontSize:'2rem',fontWeight:700,letterSpacing:'-0.03em',color:'var(--text-1)',lineHeight:1.1 }}>{value}</div>
      {subtitle && <div style={{ fontSize:'0.72rem',marginTop:'0.4rem',color:'var(--text-2)' }}>{subtitle}</div>}
      {hovered && (
        <div
          data-html2canvas-ignore
          style={{ position:'absolute',bottom:'0.4rem',right:'0.4rem',display:'flex',gap:'0.2rem' }}
        >
          <button className="btn-secondary" style={{ fontSize:'0.62rem',padding:'0.1rem 0.3rem',lineHeight:1.4 }} onClick={handleCSV}>CSV</button>
          <button className="btn-secondary" style={{ fontSize:'0.62rem',padding:'0.1rem 0.3rem',lineHeight:1.4 }} onClick={handlePng}>PNG</button>
        </div>
      )}
    </div>
  );
}
