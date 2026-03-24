import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { formatNumber } from '../../../../common/utils/format.js';
import { buildDataCSV } from '../../../domain/export/csv.js';
import { triggerDownload } from '../../../../common/utils/download.js';
import { useApp } from '../../context/AppContext.jsx';


export function DataTable() {
  const { filteredData, valueConfig } = useApp();
  const { MANUAL_LINES_PER_HOUR, BLENDED_RATE_PER_HOUR } = valueConfig;
  const [sortCol, setSortCol] = useState('netLines');
  const [sortDir, setSortDir] = useState('desc');
  const [search, setSearch] = useState('');

  // Aggregate per user over the filtered date range
  const rows = useMemo(() => {
    const byUser = {};
    for (const r of filteredData) {
      if (!byUser[r.user_login]) {
        byUser[r.user_login] = { user_login: r.user_login, days: new Set(), generations: 0, acceptances: 0, linesAdded: 0, linesDeleted: 0 };
      }
      const u = byUser[r.user_login];
      u.days.add(r.day);
      u.generations  += r.code_generation_activity_count;
      u.acceptances  += r.code_acceptance_activity_count;
      u.linesAdded   += r.loc_added_sum;
      u.linesDeleted += r.loc_deleted_sum;
    }
    return Object.values(byUser).map(u => {
      const netLines    = u.linesAdded - u.linesDeleted;
      const rate        = v => (v / MANUAL_LINES_PER_HOUR) * BLENDED_RATE_PER_HOUR;
      return {
        user_login:   u.user_login,
        daysActive:   u.days.size,
        generations:  u.generations,
        acceptances:  u.acceptances,
        acceptRate:   u.generations > 0 ? (u.acceptances / u.generations * 100) : 0,
        linesAdded:   u.linesAdded,
        linesDeleted: u.linesDeleted,
        netLines,
        valueAdded:   rate(u.linesAdded),
        valueDeleted: rate(u.linesDeleted),
        netValue:     rate(netLines),
      };
    });
  }, [filteredData, MANUAL_LINES_PER_HOUR, BLENDED_RATE_PER_HOUR]);

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

  const Th = ({ col, children, style }) => (
    <th onClick={() => handleSort(col)} style={{ textAlign: 'right', cursor: 'pointer', whiteSpace: 'nowrap', ...style }}>
      <span style={{ display:'inline-flex',alignItems:'center',gap:'0.25rem' }}>
        {children}
        <SortIcon col={col} />
      </span>
    </th>
  );

  const fmt$ = v => `$${formatNumber(Math.abs(v))}`;

  return (
    <div className="card mb-6">
      <div style={{ marginBottom:'1rem' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <h3 style={{ fontWeight:600,fontSize:'1rem',color:'var(--text-1)' }}>
            Data Explorer
            <span style={{ fontSize:'0.75rem',color:'var(--text-2)',marginLeft:'0.5rem',fontWeight:400 }}>
              aggregated per user · selected period
            </span>
            <span style={{ fontSize:'0.75rem',color:'var(--text-3)',marginLeft:'0.5rem',fontWeight:400 }}>
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
        <p style={{ fontSize:'0.72rem',color:'var(--text-3)',marginTop:'0.35rem',lineHeight:1.5 }}>
          <strong style={{ color:'var(--text-2)' }}>Generations</strong> = how many times Copilot was triggered (suggestions shown, chat prompts, agent calls — including dismissed ones).{' '}
          <strong style={{ color:'var(--text-2)' }}>Lines Added</strong> = code actually accepted and applied.
          High generations + low lines → frequent use but short or rejected suggestions.
          Low generations + high lines → fewer triggers but large completions (agent mode, big block accepts).
        </p>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th rowSpan={2} onClick={() => handleSort('user_login')} style={{ textAlign:'left', verticalAlign:'bottom', cursor:'pointer', whiteSpace:'nowrap' }}>
                <span style={{ display:'inline-flex',alignItems:'center',gap:'0.25rem' }}>User <SortIcon col="user_login" /></span>
              </th>
              <th rowSpan={2} onClick={() => handleSort('daysActive')} style={{ textAlign:'right', verticalAlign:'bottom', cursor:'pointer', whiteSpace:'nowrap' }}>
                <span style={{ display:'inline-flex',alignItems:'center',gap:'0.25rem' }}>Days Active <SortIcon col="daysActive" /></span>
              </th>
              <th style={{ textAlign:'center', color:'var(--c-green)', background:'rgba(16,185,129,0.06)', fontSize:'0.68rem', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:700, borderBottom:'1px solid var(--border)', padding:'0.4rem 1rem' }}>
                ⚡ Copilot Activity
              </th>
              <th colSpan={3} style={{ textAlign:'center', color:'var(--text-2)', background:'rgba(255,255,255,0.015)', fontSize:'0.68rem', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:700, borderBottom:'1px solid var(--border)', padding:'0.4rem 1rem' }}>
                Lines of Code
              </th>
              <th colSpan={3} style={{ textAlign:'center', color:'var(--text-2)', background:'rgba(255,255,255,0.015)', fontSize:'0.68rem', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:700, borderBottom:'1px solid var(--border)', padding:'0.4rem 1rem' }}>
                Estimated Value
              </th>
            </tr>
            <tr>
              <Th col="generations" style={{ background:'rgba(99,102,241,0.06)' }}>Generations</Th>
              <Th col="linesAdded" style={{ background:'rgba(16,185,129,0.05)', color:'var(--c-green)' }}>Lines Added</Th>
              <Th col="linesDeleted" style={{ background:'rgba(16,185,129,0.05)', color:'var(--c-red)' }}>Lines Deleted</Th>
              <Th col="netLines" style={{ background:'rgba(16,185,129,0.05)' }}>Net Lines</Th>
              <Th col="valueAdded" style={{ background:'rgba(59,130,246,0.05)', color:'var(--c-green)' }}>Value Added</Th>
              <Th col="valueDeleted" style={{ background:'rgba(59,130,246,0.05)', color:'var(--c-red)' }}>Value Deleted</Th>
              <Th col="netValue" style={{ background:'rgba(59,130,246,0.05)' }}>Net Value</Th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => (
              <tr key={row.user_login}>
                <td style={{ color:'var(--text-1)',fontWeight:500 }}>{row.user_login}</td>
                <td style={{ textAlign:'right',color:'var(--text-2)' }}>{row.daysActive}</td>
                <td style={{ textAlign:'right' }}>{formatNumber(row.generations)}</td>
                <td style={{ textAlign:'right',color:'var(--c-green)' }}>{formatNumber(row.linesAdded)}</td>
                <td style={{ textAlign:'right',color:'var(--c-red)' }}>{formatNumber(row.linesDeleted)}</td>
                <td style={{ textAlign:'right', color: row.netLines >= 0 ? 'var(--c-green)' : 'var(--c-red)' }}>
                  {row.netLines >= 0 ? '+' : ''}{formatNumber(row.netLines)}
                </td>
                <td style={{ textAlign:'right',color:'var(--c-green)' }}>{fmt$(row.valueAdded)}</td>
                <td style={{ textAlign:'right',color:'var(--c-red)' }}>{fmt$(row.valueDeleted)}</td>
                <td style={{ textAlign:'right', color: row.netValue >= 0 ? 'var(--c-green)' : 'var(--c-red)', fontWeight:500 }}>
                  {row.netValue < 0 ? '-' : ''}{fmt$(row.netValue)}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign:'center',padding:'2rem',color:'var(--text-2)' }}>No records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
