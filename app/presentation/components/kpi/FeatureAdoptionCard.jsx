import React, { useState, useRef } from 'react';
import { triggerDownload, captureElementAsPng } from '../../../../common/utils/download.js';

export function FeatureAdoptionCard({ label, pct, userCount, desc, accent }) {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef(null);
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const handleCSV = e => {
    e.stopPropagation();
    const csv = `Feature,Adoption %,Users\n"${label}",${pct},${userCount}`;
    triggerDownload(new Blob([csv], { type: 'text/csv' }), `feature-${slug}.csv`);
  };

  const handlePng = e => {
    e.stopPropagation();
    captureElementAsPng(cardRef.current, `feature-${slug}.png`);
  };

  return (
    <div
      className="kpi-card"
      ref={cardRef}
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.6rem' }}>
        <span style={{ fontSize:'0.7rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.09em',color:'var(--text-2)' }}>{label}</span>
      </div>
      <div style={{ display:'flex',alignItems:'baseline',gap:'0.5rem',marginBottom:'0.6rem' }}>
        <span style={{ fontSize:'2rem',fontWeight:700,letterSpacing:'-0.03em',color:accent,lineHeight:1 }}>{pct}%</span>
        <span style={{ fontSize:'0.75rem',color:'var(--text-2)' }}>{userCount} user{userCount !== 1 ? 's' : ''}</span>
      </div>
      <div style={{ height:'2px',background:'var(--border)',borderRadius:'9999px',overflow:'hidden' }}>
        <div style={{ height:'100%',width:pct+'%',background:accent,transition:'width 0.6s ease',borderRadius:'9999px' }} />
      </div>
      <div style={{ fontSize:'0.7rem',marginTop:'0.5rem',color:'var(--text-2)' }}>{desc}</div>
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
