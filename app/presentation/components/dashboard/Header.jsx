import React, { useRef } from 'react';
import { BarChart2, Plus, RefreshCw, Sun, Moon } from 'lucide-react';
import { useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { useApp } from '../../context/AppContext.jsx';
import { ExportMenu } from '../export/ExportMenu.jsx';

export function Header() {
  const { rawData, loadedFiles, loadFiles, resetData } = useApp();
  const fileInputRef = useRef(null);
  const { setColorScheme } = useMantineColorScheme();
  const colorScheme = useComputedColorScheme('dark');
  const toggleScheme = () => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');

  const handleAddFiles = files => {
    const valid = [...files].filter(f => f.name.endsWith('.ndjson') || f.name.endsWith('.json'));
    if (valid.length) loadFiles(valid, true);
  };

  const dateRange = rawData.length > 0
    ? (() => { const dates = rawData.map(r => r.day).sort(); return `${dates[0]} \u2013 ${dates[dates.length - 1]}`; })()
    : '';

  const indicator = loadedFiles.length > 0
    ? `${loadedFiles.length} file${loadedFiles.length > 1 ? 's' : ''} \u00b7 ${rawData.length.toLocaleString()} records${dateRange ? ' \u00b7 ' + dateRange : ''}`
    : '';

  return (
    <header className="mb-8">
      <div className="dash-nav">
        <div style={{ display:'flex',alignItems:'center',gap:'0.6rem' }}>
          <div style={{ width:'32px',height:'32px',borderRadius:'9px',background:'var(--green-glow)',border:'1px solid rgba(0,200,150,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <BarChart2 size={15} color="var(--green)" />
          </div>
          <span style={{ fontSize:'0.95rem',fontWeight:600,letterSpacing:'-0.018em',color:'var(--text-1)' }}>Copilot Analytics</span>
          <span style={{ fontSize:'0.68rem',fontWeight:600,padding:'0.15rem 0.6rem',borderRadius:'9999px',background:'var(--surface-2)',border:'1px solid var(--border)',color:'var(--text-2)',letterSpacing:'0.04em',textTransform:'uppercase' }}>Enterprise</span>
        </div>
        <div style={{ display:'flex',gap:'0.5rem',alignItems:'center' }}>
          {indicator && <span style={{ fontSize:'0.75rem',color:'var(--text-2)',marginRight:'0.25rem' }}>{indicator}</span>}
          <input ref={fileInputRef} type="file" accept=".ndjson,.json" multiple style={{ display:'none' }} onChange={e => handleAddFiles(e.target.files)} />
          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
            <Plus size={13} /> Add Files
          </button>
          <ExportMenu />
          <button className="btn-secondary" onClick={resetData}>
            <RefreshCw size={13} /> Reset
          </button>
          <button className="btn-secondary" onClick={toggleScheme} aria-label="Toggle theme" style={{ padding: '0.45rem 0.6rem' }}>
            {colorScheme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>
      </div>
    </header>
  );
}
