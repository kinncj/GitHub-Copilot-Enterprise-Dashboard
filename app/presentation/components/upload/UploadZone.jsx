import React, { useRef, useState } from 'react';
import { UploadCloud, FilePlus, Sun, Moon } from 'lucide-react';
import { useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { useApp } from '../../context/AppContext.jsx';

export function UploadZone() {
  const { loadFiles } = useApp();
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const { setColorScheme } = useMantineColorScheme();
  const colorScheme = useComputedColorScheme('dark');
  const toggleScheme = () => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');

  const handleFiles = files => {
    const valid = [...files].filter(f => f.name.endsWith('.ndjson') || f.name.endsWith('.json'));
    if (valid.length) loadFiles(valid, false);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ position: 'relative', zIndex: 1 }}>
      {/* top nav */}
      <nav style={{ position:'fixed',top:0,left:0,right:0,zIndex:50,height:'52px',borderBottom:'1px solid var(--border)',background:'var(--nav-bg)',backdropFilter:'blur(20px)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 1.5rem' }}>
        <div style={{ display:'flex',alignItems:'center',gap:'0.5rem' }}>
          <div style={{ width:'28px',height:'28px',borderRadius:'8px',background:'var(--green-glow)',border:'1px solid rgba(0,200,150,0.2)',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00C896" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <span style={{ fontSize:'0.875rem',fontWeight:600,letterSpacing:'-0.015em',color:'var(--text-1)' }}>Copilot Analytics</span>
        </div>
        <button className="btn-secondary" onClick={toggleScheme} aria-label="Toggle theme" style={{ padding: '0.45rem 0.6rem' }}>
          {colorScheme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
        </button>
      </nav>

      {/* hero */}
      <div style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'5rem 1.5rem 3rem' }}>
        <div style={{ width:'100%',maxWidth:'480px' }}>
          <h1 className="upload-brand fade-up" style={{ marginBottom:'1.25rem' }}>
            Understand your<br />team&#39;s <em>Copilot</em><br />usage.
          </h1>
          <p className="fade-up fade-up-2" style={{ color:'var(--text-2)',fontSize:'1rem',lineHeight:1.65,marginBottom:'2.5rem' }}>
            Upload a GitHub Copilot Enterprise NDJSON export<br />to explore team activity, feature adoption, and ROI.
          </p>

          <div
            className={`upload-zone fade-up fade-up-3${dragging ? ' drag-over' : ''}`}
            style={{ padding:'2.5rem 2rem',textAlign:'center' }}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          >
            <div style={{ display:'inline-flex',alignItems:'center',justifyContent:'center',width:'52px',height:'52px',borderRadius:'14px',background:'var(--surface-2)',border:'1px solid var(--border)',marginBottom:'1.25rem' }}>
              <UploadCloud size={24} color="var(--green)" />
            </div>
            <p style={{ fontSize:'0.9rem',fontWeight:500,color:'var(--text-1)',marginBottom:'0.35rem' }}>Drop one or more NDJSON files here</p>
            <p style={{ fontSize:'0.8rem',color:'var(--text-2)',marginBottom:'1.5rem' }}>Combine multiple 28-day exports for a longer date range</p>
            <input ref={fileInputRef} type="file" accept=".ndjson,.json" multiple style={{ display:'none' }} onChange={e => handleFiles(e.target.files)} />
            <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
              <FilePlus size={15} />
              Select Files
            </button>
          </div>

          <div className="fade-up fade-up-4" style={{ marginTop:'1rem',padding:'0.9rem 1.1rem',borderRadius:'10px',background:'var(--surface)',border:'1px solid var(--border)' }}>
            <p style={{ fontSize:'0.68rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.09em',color:'var(--text-3)',marginBottom:'0.4rem' }}>Expected format</p>
            <code style={{ fontSize:'0.73rem',fontFamily:'ui-monospace,monospace',color:'var(--green)',wordBreak:'break-all' }}>
              {`{"user_login":"octocat","day":"2024-01-15","code_generation_activity_count":150,...}`}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
