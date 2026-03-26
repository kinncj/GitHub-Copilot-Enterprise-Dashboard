import React, { useState, useRef } from 'react';
import { Star, TrendingUp, TrendingDown, AlertCircle, XCircle, Info, Award } from 'lucide-react';
import { triggerDownload, captureElementAsPng } from '../../../../common/utils/download.js';

const icons = {
  star: Star,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'alert-circle': AlertCircle,
  'x-circle': XCircle,
  award: Award,
};
const colors = { success: '#10b981', warning: '#f59e0b', error: '#ef4444', info: '#60a5fa' };

export function InsightCard({ title, subtitle, type, icon, content }) {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef(null);
  const Icon = icons[icon] || Info;
  const color = colors[type] || colors.info;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const handleCSV = e => {
    e.stopPropagation();
    const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = `Title,Type,Content,Subtitle\n${esc(title)},${esc(type)},${esc(content)},${esc(subtitle)}`;
    triggerDownload(new Blob([csv], { type: 'text/csv' }), `insight-${slug}.csv`);
  };

  const handlePng = e => {
    e.stopPropagation();
    captureElementAsPng(cardRef.current, `insight-${slug}.png`);
  };

  return (
    <div
      className="card"
      ref={cardRef}
      style={{ background: 'var(--surface-2)', position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start gap-3">
        <Icon size={20} color={color} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-1)', fontSize: '0.9rem' }}>{title}</h4>
          {subtitle && <p style={{ fontSize: '0.75rem', marginBottom: '0.5rem', color: 'var(--text-2)', fontStyle: 'italic' }}>{subtitle}</p>}
          <p style={{ fontSize: '0.875rem', color: 'var(--text-1)' }}>{content}</p>
        </div>
      </div>
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
