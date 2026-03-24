import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { formatNumber } from '../../../../common/utils/format.js';
import { buildDataCSV } from '../../../domain/export/csv.js';
import { triggerDownload } from '../../../../common/utils/download.js';
import { useApp } from '../../context/AppContext.jsx';

const COLUMNS = [
  { key: 'user_login',   label: 'User',        align: 'left'  },
  { key: 'generations',  label: 'Generations', align: 'right' },
  { key: 'acceptances',  label: 'Acceptances', align: 'right' },
  { key: 'acceptRate',   label: 'Accept Rate', align: 'right' },
  { key: 'linesAdded',   label: 'Lines Added', align: 'right' },
  { key: 'linesDeleted', label: 'Lines Del',   align: 'right' },
  { key: 'netLines',     label: 'Net Lines',   align: 'right' },
  { key: 'activeTime',   label: 'Active Min',  align: 'right' },
];

export function DataTable() {
  const { filteredData, valueConfig } = useApp();
  const [sortCol, setSortCol] = useState('generations');
  const [sortDir, setSortDir] = useState('desc');
  const [search, setSearch] = useState('');

  // Aggregate per user over the filtered date range
  const rows = useMemo(() => {
    const byUser = {};
    for (const r of filteredData) {
      if (!byUser[r.user_login]) {
        byUser[r.user_login] = { user_login: r.user_login, generations: 0, acceptances: 0, linesAdded: 0, linesDeleted: 0, activeTime: 0 };
      }
      const u = byUser[r.user_login];
      u.generations  += r.code_generation_activity_count;
      u.acceptances  += r.code_acceptance_activity_count;
      u.linesAdded   += r.loc_added_sum;
      u.linesDeleted += r.loc_deleted_sum;
      u.activeTime   += r.active_time_minutes;
    }
    return Object.values(byUser).map(u => ({
      ...u,
      acceptRate: u.generations > 0 ? (u.acceptances / u.generations * 100) : 0,
      netLines:   u.linesAdded - u.linesDeleted,
    }));
  }, [filteredData]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(r => r.user_login.toLowerCase().includes(q));
  }, [rows, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortCol];
      const bVal = b[sortCol];
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir]);

  const handleSort = col => {
    if (col === sortCol) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  const handleCSV = () => {
    const csv = buildDataCSV(filteredData, valueConfig);
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'copilot-data.csv');
  };

  const SortIcon = ({ col }) => {
    if (col !== sortCol) return null;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  return (
    <div className="card mb-6">
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem' }}>
        <h3 style={{ fontWeight:600,fontSize:'1rem',color:'var(--text-1)' }}>
          Data Explorer
          <span style={{ fontSize:'0.75rem',color:'var(--text-2)',marginLeft:'0.5rem',fontWeight:400 }}>
            {rows.length.toLocaleString()} users{filtered.length < rows.length ? ` · ${filtered.length} matching` : ''}
          </span>
        </h3>
        <div style={{ display:'flex',gap:'0.5rem',alignItems:'center' }}>
          <input
            type="text"
            placeholder="Search user..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width:'200px' }}
          />
          <button className="btn-secondary" onClick={handleCSV}>CSV</button>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {COLUMNS.map(col => (
                <th key={col.key} onClick={() => handleSort(col.key)} style={{ textAlign: col.align }}>
                  <span style={{ display:'inline-flex',alignItems:'center',gap:'0.25rem' }}>
                    {col.label}
                    <SortIcon col={col.key} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => (
              <tr key={row.user_login}>
                <td style={{ color:'var(--text-1)',fontWeight:500 }}>{row.user_login}</td>
                <td style={{ textAlign:'right',color:'var(--c-indigo)' }}>{formatNumber(row.generations)}</td>
                <td style={{ textAlign:'right' }}>{formatNumber(row.acceptances)}</td>
                <td style={{ textAlign:'right' }}>
                  {row.generations > 0 ? (
                    <span style={{ color: row.acceptRate >= 70 ? 'var(--c-green)' : row.acceptRate >= 20 ? 'var(--text-2)' : 'var(--c-red)' }}>
                      {row.acceptRate.toFixed(1)}%
                    </span>
                  ) : '—'}
                </td>
                <td style={{ textAlign:'right',color:'var(--c-green)' }}>{formatNumber(row.linesAdded)}</td>
                <td style={{ textAlign:'right',color:'var(--c-red)' }}>{formatNumber(row.linesDeleted)}</td>
                <td style={{ textAlign:'right' }}>{formatNumber(row.netLines)}</td>
                <td style={{ textAlign:'right' }}>{formatNumber(row.activeTime)}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} style={{ textAlign:'center',padding:'2rem',color:'var(--text-2)' }}>No records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
