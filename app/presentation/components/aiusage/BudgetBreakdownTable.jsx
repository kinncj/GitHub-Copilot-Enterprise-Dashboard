import React, { useState, useMemo, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { formatCredits, formatCurrency } from '../../../../common/utils/format.js';
import { triggerDownload, captureElementAsPng } from '../../../../common/utils/download.js';
import { CONFIG } from '../../../domain/config/constants.js';

const usd = credits => credits * CONFIG.CREDIT_USD;

/**
 * Credits-used / credits-allotted / spend / allocated-budget breakdown for a
 * given level. `level` is 'org' or 'user' — both read from aiUsageBudget so the
 * numbers always match the burn-rate projections above.
 */
export function BudgetBreakdownTable({ level }) {
  const { aiUsageBudget } = useApp();
  const isOrg = level === 'org';
  const bucket = (isOrg ? aiUsageBudget?.byOrg : aiUsageBudget?.byUser) || {};
  const nameLabel = isOrg ? 'Organization' : 'User';

  const [sortCol, setSortCol] = useState('used');
  const [sortDir, setSortDir] = useState('desc');
  const [search, setSearch] = useState('');
  const cardRef = useRef(null);

  const rows = useMemo(() => Object.entries(bucket).map(([name, b]) => ({
    name,
    used: b.consumed,
    allotted: b.budget,
    usedPct: b.consumedPct * 100,
    projected: b.projected,
    projectedPct: b.projectedPct * 100,
  })), [bucket]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(r => r.name.toLowerCase().includes(q));
  }, [rows, search]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const av = a[sortCol], bv = b[sortCol];
    const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
    return sortDir === 'asc' ? cmp : -cmp;
  }), [filtered, sortCol, sortDir]);

  const handleSort = col => {
    if (col === sortCol) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortCol(col); setSortDir('desc'); }
  };

  const handleCSV = () => {
    const header = `${nameLabel},Credits Used,Credits Allotted,% Used,Projected Credits,Projected %,Consumption Value,Allocated Budget`;
    const body = sorted.map(r =>
      `${r.name},${r.used.toFixed(2)},${r.allotted},${r.usedPct.toFixed(1)}%,${r.projected.toFixed(2)},${r.projectedPct.toFixed(1)}%,${usd(r.used).toFixed(2)},${usd(r.allotted).toFixed(2)}`
    );
    triggerDownload(new Blob([[header, ...body].join('\n')], { type: 'text/csv' }), `budget-by-${level}.csv`);
  };

  const SortIcon = ({ col }) => (col !== sortCol ? null : sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />);
  const Th = ({ col, children, align = 'right' }) => (
    <th onClick={() => handleSort(col)} style={{ textAlign: align, cursor: 'pointer', whiteSpace: 'nowrap' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>{children}<SortIcon col={col} /></span>
    </th>
  );
  const pctColor = p => (p > 100 ? 'var(--c-red)' : p >= CONFIG.NEAR_QUOTA_THRESHOLD * 100 ? '#f59e0b' : 'var(--text-2)');

  return (
    <div className="card mb-6" ref={cardRef}>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-1)' }}>
          Budget by {isOrg ? 'Organization' : 'User'}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginLeft: '0.5rem', fontWeight: 400 }}>
            credits &amp; dollars — used vs allotted ({rows.length.toLocaleString()} {isOrg ? 'orgs' : 'users'})
          </span>
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {!isOrg && <input type="text" placeholder="Search user..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '180px' }} />}
          <button className="btn-secondary" onClick={handleCSV}>CSV</button>
          <button className="btn-secondary" onClick={() => captureElementAsPng(cardRef.current, `budget-by-${level}.png`)}>PNG</button>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <Th col="name" align="left">{nameLabel}</Th>
              <Th col="used">Credits Used</Th>
              <Th col="allotted">Credits Allotted</Th>
              <Th col="usedPct">% Used</Th>
              <Th col="projectedPct">Projected %</Th>
              <Th col="used">Consumption Value</Th>
              <Th col="allotted">Allocated Budget</Th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(r => (
              <tr key={r.name}>
                <td style={{ color: 'var(--text-1)', fontWeight: 500 }}>{r.name}</td>
                <td style={{ textAlign: 'right' }}>{formatCredits(r.used)}</td>
                <td style={{ textAlign: 'right', color: 'var(--text-2)' }}>{r.allotted ? formatCredits(r.allotted) : '—'}</td>
                <td style={{ textAlign: 'right', color: pctColor(r.usedPct) }}>{r.allotted ? r.usedPct.toFixed(0) + '%' : '—'}</td>
                <td style={{ textAlign: 'right', color: pctColor(r.projectedPct), fontWeight: r.projectedPct > 100 ? 600 : 400 }}>{r.allotted ? r.projectedPct.toFixed(0) + '%' : '—'}</td>
                <td style={{ textAlign: 'right', color: 'var(--c-green)' }}>{formatCurrency(usd(r.used))}</td>
                <td style={{ textAlign: 'right', color: 'var(--text-2)' }}>{r.allotted ? formatCurrency(usd(r.allotted)) : '—'}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-2)' }}>No records found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
