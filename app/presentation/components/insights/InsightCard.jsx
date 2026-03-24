import React from 'react';
import { Star, TrendingUp, TrendingDown, AlertCircle, XCircle, Info } from 'lucide-react';

const icons = {
  star: Star,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'alert-circle': AlertCircle,
  'x-circle': XCircle
};
const colors = { success: '#10b981', warning: '#f59e0b', error: '#ef4444', info: '#60a5fa' };

export function InsightCard({ title, subtitle, type, icon, content }) {
  const Icon = icons[icon] || Info;
  const color = colors[type] || colors.info;
  return (
    <div className="card" style={{ background: 'var(--surface-2)' }}>
      <div className="flex items-start gap-3">
        <Icon size={20} color={color} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-1)', fontSize: '0.9rem' }}>{title}</h4>
          {subtitle && <p style={{ fontSize: '0.75rem', marginBottom: '0.5rem', color: 'var(--text-2)', fontStyle: 'italic' }}>{subtitle}</p>}
          <p style={{ fontSize: '0.875rem', color: 'var(--text-1)' }}>{content}</p>
        </div>
      </div>
    </div>
  );
}
