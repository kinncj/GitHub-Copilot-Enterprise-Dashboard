import React from 'react';
import { Info } from 'lucide-react';

export function KpiCard({ label, value, subtitle, description, tooltip }) {
  return (
    <div className="kpi-card">
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
    </div>
  );
}
