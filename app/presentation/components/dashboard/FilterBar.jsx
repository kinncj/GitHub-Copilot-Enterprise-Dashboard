import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { quickRangeDates } from '../../../domain/filtering/engine.js';

export function FilterBar() {
  const { filters, setFilters, filterOptions, rawData } = useApp();

  const setFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val || null }));

  const applyQuickRange = days => {
    const range = quickRangeDates(rawData, days);
    setFilters(prev => ({ ...prev, dateFrom: range.dateFrom, dateTo: range.dateTo }));
  };

  const clearAll = () => {
    const allDates = rawData.map(r => r.day).sort();
    setFilters({
      dateFrom: allDates[0] || null,
      dateTo: allDates[allDates.length - 1] || null,
      user: null, ide: null, language: null
    });
  };

  return (
    <div className="card mb-6">
      <div style={{ display:'flex',flexWrap:'wrap',gap:'0.75rem',alignItems:'flex-end' }}>
        {/* Date range */}
        <div style={{ display:'flex',flexDirection:'column',gap:'0.25rem' }}>
          <label style={{ fontSize:'0.68rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-2)' }}>From</label>
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={e => setFilter('dateFrom', e.target.value)}
          />
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:'0.25rem' }}>
          <label style={{ fontSize:'0.68rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-2)' }}>To</label>
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={e => setFilter('dateTo', e.target.value)}
          />
        </div>

        {/* Quick ranges */}
        <div style={{ display:'flex',flexDirection:'column',gap:'0.25rem' }}>
          <label style={{ fontSize:'0.68rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-2)' }}>Quick Range</label>
          <div style={{ display:'flex',gap:'0.35rem' }}>
            {[7, 14, 28, 90].map(d => (
              <button key={d} className="btn-secondary" style={{ padding:'0.3rem 0.7rem',fontSize:'0.75rem' }} onClick={() => applyQuickRange(d)}>
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* User filter */}
        <div style={{ display:'flex',flexDirection:'column',gap:'0.25rem' }}>
          <label style={{ fontSize:'0.68rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-2)' }}>User</label>
          <select value={filters.user || ''} onChange={e => setFilter('user', e.target.value)}>
            <option value="">All Users</option>
            {filterOptions.users.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        {/* IDE filter */}
        <div style={{ display:'flex',flexDirection:'column',gap:'0.25rem' }}>
          <label style={{ fontSize:'0.68rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-2)' }}>IDE</label>
          <select value={filters.ide || ''} onChange={e => setFilter('ide', e.target.value)}>
            <option value="">All IDEs</option>
            {filterOptions.ides.map(ide => <option key={ide} value={ide}>{ide}</option>)}
          </select>
        </div>

        {/* Language filter */}
        <div style={{ display:'flex',flexDirection:'column',gap:'0.25rem' }}>
          <label style={{ fontSize:'0.68rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-2)' }}>Language</label>
          <select value={filters.language || ''} onChange={e => setFilter('language', e.target.value)}>
            <option value="">All Languages</option>
            {filterOptions.languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
          </select>
        </div>

        {/* Clear */}
        <button className="btn-secondary" onClick={clearAll} style={{ alignSelf:'flex-end' }}>
          Clear All
        </button>
      </div>
    </div>
  );
}
