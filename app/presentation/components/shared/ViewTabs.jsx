import React from 'react';
import { BarChart2, DollarSign } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

/**
 * Activity / AI Usage view switcher. Renders only when both datasets are
 * loaded — otherwise the single loaded view is shown without a chrome tab.
 */
export function ViewTabs() {
  const { hasActivity, hasAIUsage, activeView, setActiveView } = useApp();
  if (!(hasActivity && hasAIUsage)) return null;

  const tabs = [
    { id: 'activity', label: 'Activity', Icon: BarChart2 },
    { id: 'aiusage', label: 'AI Usage', Icon: DollarSign },
  ];

  return (
    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem' }}>
      {tabs.map(({ id, label, Icon }) => {
        const active = activeView === id;
        return (
          <button
            key={id}
            className="btn-secondary"
            onClick={() => setActiveView(id)}
            aria-pressed={active}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.45rem 0.9rem',
              background: active ? 'var(--green-glow)' : 'var(--surface)',
              borderColor: active ? 'rgba(0,200,150,0.35)' : 'var(--border)',
              color: active ? 'var(--green)' : 'var(--text-2)',
              fontWeight: active ? 600 : 500,
            }}
          >
            <Icon size={14} /> {label}
          </button>
        );
      })}
    </div>
  );
}
