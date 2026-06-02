import React, { useState, useMemo, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { formatNumber, formatCurrency, formatCredits } from '../../../../common/utils/format.js';
import { buildAIUsageUserCSV } from '../../../domain/aiusage/export.js';
import { triggerDownload, captureElementAsPng } from '../../../../common/utils/download.js';
import { useApp } from '../../context/AppContext.jsx';

export function AIUsageTable() {
  const { aiUsageAggregated } = useApp();
  const [sortCol, setSortCol] = useState('credits');
  const [sortDir, setSortDir] = useState('desc');
  const [search, setSearch] = useState('');
  const cardRef = useRef(null);

  const rows = useMemo(() => {
    return Object.entries(aiUsageAggregated.byUser || {}).map(([user, u]) => ({
      user,
      daysActive: u.daysActive,
      credits: u.credits,
      gross: u.gross,
      net: u.net,
      quota: u.quota,
      quotaPct: u.quota > 0 ? (u.credits / u.quota) * 100 : 0,
      models: u.modelCount,
    }));
  }, [aiUsageAggregated]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(r => r.user.toLowerCase().includes(q));
  }, [rows, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortCol], bVal = b[sortCol];
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir]);

  const handleSort = col => {
    if (col === sortCol) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortCol(col); setSortDir('desc'); }
  };

  const handleCSV = () => {
    const csv = buildAIUsageUserCSV(aiUsageAggregated);
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'aiusage-by-user.csv');
  };

  const SortIcon = ({ col }) => (col !== sortCol ? null : sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />);

  const Th = ({ col, children, align = 'right' }) => (
    <th onClick={() => handleSort(col)} style={{ textAlign: align, cursor: 'pointer', whiteSpace: 'nowrap' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>{children}<SortIcon col={col} /></span>
    </th>
  );

  return (
    <div className="card mb-6" ref={cardRef}>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-1)' }}>
          AI Usage by User
          <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginLeft: '0.5rem', fontWeight: 400 }}>
            {rows.length.toLocaleString()} users{filtered.length < rows.length ? ` · ${filtered.length} matching` : ''}
          </span>
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input type="text" placeholder="Search user..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '200px' }} />
          <button className="btn-secondary" onClick={handleCSV}>CSV</button>
          <button className="btn-secondary" onClick={() => captureElementAsPng(cardRef.current, 'aiusage-by-user.png')}>PNG</button>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <Th col="user" align="left">User</Th>
              <Th col="daysActive">Days</Th>
              <Th col="credits">Credits</Th>
              <Th col="gross">Gross</Th>
              <Th col="net">Net</Th>
              <Th col="quota">Quota</Th>
              <Th col="quotaPct">% Quota</Th>
              <Th col="models">Models</Th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => (
              <tr key={row.user}>
                <td style={{ color: 'var(--text-1)', fontWeight: 500 }}>{row.user}</td>
                <td style={{ textAlign: 'right', color: 'var(--text-2)' }}>{row.daysActive}</td>
                <td style={{ textAlign: 'right' }}>{formatCredits(row.credits)}</td>
                <td style={{ textAlign: 'right', color: 'var(--c-green)' }}>{formatCurrency(row.gross)}</td>
                <td style={{ textAlign: 'right', color: 'var(--text-2)' }}>{formatCurrency(row.net)}</td>
                <td style={{ textAlign: 'right', color: 'var(--text-2)' }}>{row.quota ? formatNumber(row.quota) : '—'}</td>
                <td style={{ textAlign: 'right', color: row.quotaPct >= 80 ? 'var(--c-red)' : 'var(--text-2)' }}>
                  {row.quota ? row.quotaPct.toFixed(0) + '%' : '—'}
                </td>
                <td style={{ textAlign: 'right', color: 'var(--text-2)' }}>{row.models}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-2)' }}>No records found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
