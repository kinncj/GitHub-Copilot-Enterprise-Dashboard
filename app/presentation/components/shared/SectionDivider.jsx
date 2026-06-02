import React from 'react';
import { Activity, Users, Code2, DollarSign, Cpu, Building2, Gauge, Wallet } from 'lucide-react';

const icons = { activity: Activity, users: Users, 'code-2': Code2, 'dollar-sign': DollarSign, cpu: Cpu, 'building-2': Building2, gauge: Gauge, wallet: Wallet };

export function SectionDivider({ icon, label }) {
  const Icon = icons[icon] || Activity;
  return (
    <div className="flex items-center gap-2 mb-4 mt-2 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
      <Icon size={16} color="var(--green)" />
      <span className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--text-1)' }}>{label}</span>
    </div>
  );
}
