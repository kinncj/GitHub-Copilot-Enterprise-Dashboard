import React, { useState } from 'react';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { CONFIG } from '../../../domain/config/constants.js';

const LS_KEY = 'copilot_value_config';

export function ValueConfig() {
  const { valueConfig, setValueConfig } = useApp();
  const [open, setOpen] = useState(false);

  const update = (key, val) => {
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      const next = { ...valueConfig, [key]: num };
      setValueConfig(next);
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    }
  };

  const reset = () => {
    const defaults = {
      MANUAL_LINES_PER_HOUR: CONFIG.MANUAL_LINES_PER_HOUR,
      BLENDED_RATE_PER_HOUR: CONFIG.BLENDED_RATE_PER_HOUR
    };
    setValueConfig(defaults);
    try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
  };

  return (
    <div className="card mb-6">
      <button
        onClick={() => setOpen(v => !v)}
        style={{ display:'flex',justifyContent:'space-between',alignItems:'center',width:'100%',background:'none',border:'none',cursor:'pointer',color:'var(--text-1)',padding:0 }}
      >
        <span style={{ display:'flex',alignItems:'center',gap:'0.5rem',fontWeight:600,fontSize:'0.9rem' }}>
          <Settings size={16} color="var(--green)" />
          Value Calculation Configuration
        </span>
        {open ? <ChevronUp size={16} color="var(--text-2)" /> : <ChevronDown size={16} color="var(--text-2)" />}
      </button>
      {open && (
        <div style={{ marginTop:'1rem' }}>
          <p style={{ fontSize:'0.8rem',color:'var(--text-2)',marginBottom:'1rem',lineHeight:1.6 }}>
            These values drive the "Value Estimate" KPIs. They are rough proxies — not ROI measurements.
            Adjust to match your team's typical hourly rate and writing speed.
          </p>
          <div style={{ display:'flex',gap:'1.5rem',flexWrap:'wrap',alignItems:'flex-end' }}>
            <div style={{ display:'flex',flexDirection:'column',gap:'0.25rem' }}>
              <label style={{ fontSize:'0.68rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-2)' }}>
                Manual Lines / Hour
              </label>
              <input
                type="number"
                min="1"
                value={valueConfig.MANUAL_LINES_PER_HOUR}
                onChange={e => update('MANUAL_LINES_PER_HOUR', e.target.value)}
                style={{ width:'120px' }}
              />
              <span style={{ fontSize:'0.68rem',color:'var(--text-3)' }}>Default: {CONFIG.MANUAL_LINES_PER_HOUR}</span>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:'0.25rem' }}>
              <label style={{ fontSize:'0.68rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-2)' }}>
                Blended Rate / Hour ($)
              </label>
              <input
                type="number"
                min="1"
                value={valueConfig.BLENDED_RATE_PER_HOUR}
                onChange={e => update('BLENDED_RATE_PER_HOUR', e.target.value)}
                style={{ width:'120px' }}
              />
              <span style={{ fontSize:'0.68rem',color:'var(--text-3)' }}>Default: ${CONFIG.BLENDED_RATE_PER_HOUR}</span>
            </div>
            <button className="btn-secondary" onClick={reset} style={{ alignSelf:'flex-end' }}>
              Reset Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
