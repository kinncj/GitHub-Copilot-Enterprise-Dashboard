import React, { useRef, useState } from 'react';
import { UploadCloud, FilePlus, Sun, Moon, BarChart2, DollarSign } from 'lucide-react';
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
    const valid = [...files].filter(f => /\.(ndjson|json|csv)$/i.test(f.name));
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
      <div style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'5rem 1.5rem calc(36px + 2rem)' }}>
        <div style={{ width:'100%',maxWidth:'540px' }}>
          <h1 className="upload-brand fade-up" style={{ marginBottom:'1.25rem' }}>
            Understand your<br />team&#39;s <em>Copilot</em><br />usage &amp; cost.
          </h1>
          <p className="fade-up fade-up-2" style={{ color:'var(--text-2)',fontSize:'1rem',lineHeight:1.65,marginBottom:'2.5rem' }}>
            Drop either of GitHub&#39;s two exports — the <strong style={{ color:'var(--text-1)' }}>Copilot activity</strong> NDJSON
            or the <strong style={{ color:'var(--text-1)' }}>AI Usage</strong> billing CSV. Load both to switch between
            adoption and budget views. Everything runs in your browser.
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
            <p style={{ fontSize:'0.9rem',fontWeight:500,color:'var(--text-1)',marginBottom:'0.35rem' }}>Drop NDJSON or AI Usage CSV files here</p>
            <p style={{ fontSize:'0.8rem',color:'var(--text-2)',marginBottom:'1.5rem' }}>Combine multiple exports — file type is detected automatically</p>
            <input ref={fileInputRef} type="file" accept=".ndjson,.json,.csv" multiple style={{ display:'none' }} onChange={e => handleFiles(e.target.files)} />
            <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
              <FilePlus size={15} />
              Select Files
            </button>
          </div>

          <div className="fade-up fade-up-4" style={{ marginTop:'1rem',display:'grid',gap:'0.6rem' }}>
            <FormatCard
              icon={<BarChart2 size={14} color="var(--green)" />}
              title="Activity export"
              ext=".ndjson / .json"
              powers="usage, adoption, lines-of-code & productivity"
              sample={`{"user_login":"octocat","day":"2024-01-15","code_generation_activity_count":150, ...}`}
            />
            <FormatCard
              icon={<DollarSign size={14} color="var(--green)" />}
              title="AI Usage report"
              ext=".csv"
              powers="AI-credit consumption, cost & budget burn-rate"
              sample={`date,username,product,sku,model,quantity,unit_type,gross_amount,total_monthly_quota,organization, ...`}
            />
          </div>
        </div>
      </div>

    </div>
  );
}

function FormatCard({ icon, title, ext, powers, sample }) {
  return (
    <div style={{ padding:'0.8rem 1rem',borderRadius:'10px',background:'var(--surface)',border:'1px solid var(--border)',textAlign:'left' }}>
      <div style={{ display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'0.4rem' }}>
        {icon}
        <span style={{ fontSize:'0.78rem',fontWeight:600,color:'var(--text-1)' }}>{title}</span>
        <span style={{ fontSize:'0.62rem',fontFamily:'ui-monospace,monospace',color:'var(--text-3)',background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:'5px',padding:'0.05rem 0.35rem' }}>{ext}</span>
        <span style={{ fontSize:'0.68rem',color:'var(--text-3)',marginLeft:'auto' }}>{powers}</span>
      </div>
      <code style={{ display:'block',fontSize:'0.68rem',fontFamily:'ui-monospace,monospace',color:'var(--green)',wordBreak:'break-all',lineHeight:1.5 }}>
        {sample}
      </code>
    </div>
  );
}
