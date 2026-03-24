import React from 'react';

export function FeatureAdoptionCard({ label, pct, userCount, desc, accent }) {
  return (
    <div className="kpi-card">
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
    </div>
  );
}
