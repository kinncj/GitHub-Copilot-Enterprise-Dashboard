import React from 'react';
import { useApp } from '../../context/AppContext.jsx';

export function ProgressBar() {
  const { progress } = useApp();
  return (
    <div style={{ position:'fixed',top:0,left:0,right:0,zIndex:50,padding:'0.6rem 1.5rem',background:'rgba(8,8,8,0.92)',borderBottom:'1px solid var(--border)',backdropFilter:'blur(16px)' }}>
      <div style={{ maxWidth:'1280px',margin:'0 auto' }}>
        <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'0.4rem' }}>
          <span style={{ fontSize:'0.8rem',color:'var(--text-2)' }}>{progress.label || 'Processing\u2026'}</span>
          <span style={{ fontSize:'0.8rem',fontWeight:600,color:'var(--green)' }}>{Math.round(progress.pct)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: progress.pct + '%' }} />
        </div>
      </div>
    </div>
  );
}
