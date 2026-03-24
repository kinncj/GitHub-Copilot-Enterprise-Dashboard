import React from 'react';
import { Select } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { useApp } from '../../context/AppContext.jsx';
import { quickRangeDates } from '../../../domain/filtering/engine.js';

const LABEL_STYLE = {
  fontSize: '0.68rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-2)',
  marginBottom: '0.25rem',
};

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
      user: null, ide: null, language: null,
    });
  };

  const dateFromValue = filters.dateFrom ? dayjs(filters.dateFrom).toDate() : null;
  const dateToValue = filters.dateTo ? dayjs(filters.dateTo).toDate() : null;

  const userOptions = [
    { value: '', label: 'All Users' },
    ...filterOptions.users.map(u => ({ value: u, label: u })),
  ];
  const ideOptions = [
    { value: '', label: 'All IDEs' },
    ...filterOptions.ides.map(ide => ({ value: ide, label: ide })),
  ];
  const langOptions = [
    { value: '', label: 'All Languages' },
    ...filterOptions.languages.map(lang => ({ value: lang, label: lang })),
  ];

  return (
    <div className="card mb-6">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>

        {/* Date range picker */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={LABEL_STYLE}>Date Range</span>
          <DatePickerInput
            type="range"
            value={[dateFromValue, dateToValue]}
            onChange={([from, to]) => {
              setFilters(prev => ({
                ...prev,
                dateFrom: from ? dayjs(from).format('YYYY-MM-DD') : null,
                dateTo: to ? dayjs(to).format('YYYY-MM-DD') : null,
              }));
            }}
            placeholder="Pick date range"
            clearable
            numberOfColumns={1}
            popoverProps={{ withinPortal: true, width: 300 }}
            style={{ minWidth: '240px' }}
            aria-label="Date Range"
          />
        </div>

        {/* Quick ranges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={LABEL_STYLE}>Quick Range</span>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {[7, 14, 28, 90].map(d => (
              <button
                key={d}
                className="btn-secondary"
                style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem' }}
                onClick={() => applyQuickRange(d)}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* User filter */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={LABEL_STYLE}>User</span>
          <Select
            data={userOptions}
            value={filters.user || ''}
            onChange={val => setFilter('user', val)}
            placeholder="All Users"
            searchable
            clearable
            comboboxProps={{ withinPortal: true }}
            style={{ minWidth: '160px' }}
            aria-label="All Users"
          />
        </div>

        {/* IDE filter */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={LABEL_STYLE}>IDE</span>
          <Select
            data={ideOptions}
            value={filters.ide || ''}
            onChange={val => setFilter('ide', val)}
            placeholder="All IDEs"
            searchable
            clearable
            comboboxProps={{ withinPortal: true }}
            style={{ minWidth: '140px' }}
            aria-label="All IDEs"
          />
        </div>

        {/* Language filter */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={LABEL_STYLE}>Language</span>
          <Select
            data={langOptions}
            value={filters.language || ''}
            onChange={val => setFilter('language', val)}
            placeholder="All Languages"
            searchable
            clearable
            comboboxProps={{ withinPortal: true }}
            style={{ minWidth: '150px' }}
            aria-label="All Languages"
          />
        </div>

        {/* Clear */}
        <button className="btn-secondary" onClick={clearAll} style={{ alignSelf: 'flex-end' }}>
          Clear All
        </button>
      </div>
    </div>
  );
}
