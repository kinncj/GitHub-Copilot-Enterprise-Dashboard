import React, { useState } from 'react';
import { Settings, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { deriveDefaultLicenses } from '../../../domain/aiusage/budget.js';
import { formatCredits, formatCurrency } from '../../../../common/utils/format.js';
import { CONFIG } from '../../../domain/config/constants.js';

const labelStyle = { fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)' };

export function LicenseConfig() {
  const { aiUsageFiltered, aiUsageBudget, licenseConfig, setLicenseConfig } = useApp();
  const [open, setOpen] = useState(false);
  if (!aiUsageBudget) return null;

  const enabled = !!(licenseConfig && licenseConfig.enabled);
  const orgs = (licenseConfig && licenseConfig.orgs) || {};

  const persist = setLicenseConfig; // in-memory only; dataset-specific, never persisted

  const seedIfEmpty = () => (licenseConfig && licenseConfig.orgs && Object.keys(licenseConfig.orgs).length)
    ? licenseConfig.orgs
    : deriveDefaultLicenses(aiUsageFiltered).orgs;

  const toggleEnabled = () => persist({ enabled: !enabled, orgs: seedIfEmpty() });

  const clone = () => JSON.parse(JSON.stringify(orgs));
  const updateRow = (org, i, field, val) => {
    const next = clone();
    next[org][i] = { ...next[org][i], [field]: field === 'name' ? val : (parseFloat(val) || 0) };
    persist({ enabled: true, orgs: next });
  };
  const addRow = org => { const next = clone(); (next[org] = next[org] || []).push({ name: 'New tier', quota: 0, seats: 0 }); persist({ enabled: true, orgs: next }); };
  const removeRow = (org, i) => { const next = clone(); next[org].splice(i, 1); persist({ enabled: true, orgs: next }); };
  const addOrg = name => { const n = (name || '').trim(); if (!n || orgs[n]) return; const next = clone(); next[n] = [{ name: 'New tier', quota: 0, seats: 0 }]; persist({ enabled: true, orgs: next }); };
  const reset = () => persist(null);

  const ent = aiUsageBudget.enterprise;
  const usd = c => formatCurrency(c * CONFIG.CREDIT_USD);

  return (
    <div className="card mb-6">
      <button onClick={() => setOpen(v => !v)}
        style={{ display:'flex',justifyContent:'space-between',alignItems:'center',width:'100%',background:'none',border:'none',cursor:'pointer',color:'var(--text-1)',padding:0 }}>
        <span style={{ display:'flex',alignItems:'center',gap:'0.5rem',fontWeight:600,fontSize:'0.9rem' }}>
          <Settings size={16} color="var(--green)" />
          License &amp; Budget Configuration
          <span style={{ ...labelStyle, color: enabled ? 'var(--green)' : 'var(--text-3)', marginLeft:'0.25rem' }}>
            {enabled ? 'configured licenses' : 'CSV-derived (active users)'}
          </span>
        </span>
        {open ? <ChevronUp size={16} color="var(--text-2)" /> : <ChevronDown size={16} color="var(--text-2)" />}
      </button>

      {open && (
        <div style={{ marginTop:'1rem' }}>
          <p style={{ fontSize:'0.8rem',color:'var(--text-2)',marginBottom:'1rem',lineHeight:1.6 }}>
            The export only contains <strong>active</strong> users, so the default budget counts only seats that were used.
            Enter your real <strong>licenses per tier</strong> (per org) to set accurate org &amp; enterprise budgets — including idle
            seats and tiers the CSV doesn't show. Individual budgets always use each user's own quota from the file.
          </p>

          <label style={{ display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'1rem',cursor:'pointer',fontSize:'0.82rem',color:'var(--text-1)' }}>
            <input type="checkbox" checked={enabled} onChange={toggleEnabled} />
            Use configured licenses for org &amp; enterprise budgets
          </label>

          {enabled && (
            <>
              {Object.entries(orgs).map(([org, rows]) => (
                <div key={org} style={{ marginBottom:'1rem',padding:'0.75rem',borderRadius:'8px',background:'var(--surface-2)',border:'1px solid var(--border)' }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.5rem' }}>
                    <span style={{ fontWeight:600,fontSize:'0.85rem',color:'var(--text-1)' }}>{org}</span>
                    <span style={{ fontSize:'0.72rem',color:'var(--text-2)' }}>
                      {rows.reduce((s,l)=>s+(Number(l.seats)||0),0).toLocaleString()} seats ·{' '}
                      {formatCredits(rows.reduce((s,l)=>s+(Number(l.seats)||0)*(Number(l.quota)||0),0))} cr ·{' '}
                      {usd(rows.reduce((s,l)=>s+(Number(l.seats)||0)*(Number(l.quota)||0),0))}
                    </span>
                  </div>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 130px 110px 28px',gap:'0.5rem',alignItems:'center' }}>
                    <span style={labelStyle}>License type</span>
                    <span style={{ ...labelStyle, textAlign:'right' }}>Credits / seat</span>
                    <span style={{ ...labelStyle, textAlign:'right' }}>Seats</span>
                    <span />
                    {rows.map((row, i) => (
                      <React.Fragment key={i}>
                        <input type="text" value={row.name} onChange={e => updateRow(org, i, 'name', e.target.value)} />
                        <input type="number" min="0" value={row.quota} onChange={e => updateRow(org, i, 'quota', e.target.value)} style={{ textAlign:'right' }} />
                        <input type="number" min="0" value={row.seats} onChange={e => updateRow(org, i, 'seats', e.target.value)} style={{ textAlign:'right' }} />
                        <button className="btn-secondary" style={{ padding:'0.3rem' }} onClick={() => removeRow(org, i)} aria-label="Remove tier"><X size={12} /></button>
                      </React.Fragment>
                    ))}
                  </div>
                  <button className="btn-secondary" style={{ marginTop:'0.5rem',fontSize:'0.72rem' }} onClick={() => addRow(org)}>
                    <Plus size={11} /> Add license type
                  </button>
                </div>
              ))}

              <AddOrg onAdd={addOrg} />

              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'1rem',paddingTop:'0.75rem',borderTop:'1px solid var(--border)' }}>
                <span style={{ fontSize:'0.85rem',color:'var(--text-1)' }}>
                  <strong>Enterprise budget:</strong> {formatCredits(ent.budget)} credits · {usd(ent.budget)} · {ent.seats.toLocaleString()} seats
                </span>
                <button className="btn-secondary" onClick={reset}>Reset to CSV</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AddOrg({ onAdd }) {
  const [name, setName] = useState('');
  const submit = () => { onAdd(name); setName(''); };
  return (
    <div style={{ display:'flex',gap:'0.5rem',alignItems:'center' }}>
      <input type="text" placeholder="Add organization…" value={name}
        onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} style={{ width:'220px' }} />
      <button className="btn-secondary" onClick={submit} style={{ fontSize:'0.72rem' }}><Plus size={11} /> Add org</button>
    </div>
  );
}
