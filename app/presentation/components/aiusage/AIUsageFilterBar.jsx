import React from 'react';
import { Select } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { useApp } from '../../context/AppContext.jsx';

const LABEL_STYLE = {
  fontSize: '0.68rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-2)',
  marginBottom: '0.25rem',
};

export function AIUsageFilterBar() {
  const { aiUsageFilters, setAiUsageFilters, aiUsageFilterOptions, aiUsageRaw } = useApp();

  const setFilter = (key, val) => setAiUsageFilters(prev => ({ ...prev, [key]: val || null }));

  const clearAll = () => {
    const allDates = aiUsageRaw.map(r => r.date).sort();
    setAiUsageFilters({
      dateFrom: allDates[0] || null,
      dateTo: allDates[allDates.length - 1] || null,
      user: null, model: null, org: null, costCenter: null,
    });
  };

  const dateFromValue = aiUsageFilters.dateFrom ? dayjs(aiUsageFilters.dateFrom).toDate() : null;
  const dateToValue = aiUsageFilters.dateTo ? dayjs(aiUsageFilters.dateTo).toDate() : null;

  const opt = (all, allLabel) => [{ value: '', label: allLabel }, ...all.map(v => ({ value: v, label: v }))];

  return (
    <div className="card mb-6">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={LABEL_STYLE}>Date Range</span>
          <DatePickerInput
            type="range"
            value={[dateFromValue, dateToValue]}
            onChange={([from, to]) => {
              setAiUsageFilters(prev => ({
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

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={LABEL_STYLE}>User</span>
          <Select
            data={opt(aiUsageFilterOptions.users, 'All Users')}
            value={aiUsageFilters.user || ''}
            onChange={val => setFilter('user', val)}
            placeholder="All Users" searchable clearable
            comboboxProps={{ withinPortal: true }} style={{ minWidth: '160px' }} aria-label="All Users"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={LABEL_STYLE}>Model</span>
          <Select
            data={opt(aiUsageFilterOptions.models, 'All Models')}
            value={aiUsageFilters.model || ''}
            onChange={val => setFilter('model', val)}
            placeholder="All Models" searchable clearable
            comboboxProps={{ withinPortal: true }} style={{ minWidth: '160px' }} aria-label="All Models"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={LABEL_STYLE}>Organization</span>
          <Select
            data={opt(aiUsageFilterOptions.orgs, 'All Orgs')}
            value={aiUsageFilters.org || ''}
            onChange={val => setFilter('org', val)}
            placeholder="All Orgs" searchable clearable
            comboboxProps={{ withinPortal: true }} style={{ minWidth: '150px' }} aria-label="All Orgs"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={LABEL_STYLE}>Cost Center</span>
          <Select
            data={opt(aiUsageFilterOptions.costCenters, 'All Cost Centers')}
            value={aiUsageFilters.costCenter || ''}
            onChange={val => setFilter('costCenter', val)}
            placeholder="All Cost Centers" searchable clearable
            comboboxProps={{ withinPortal: true }} style={{ minWidth: '160px' }} aria-label="All Cost Centers"
          />
        </div>

        <button className="btn-secondary" onClick={clearAll} style={{ alignSelf: 'flex-end' }}>
          Clear All
        </button>
      </div>
    </div>
  );
}
