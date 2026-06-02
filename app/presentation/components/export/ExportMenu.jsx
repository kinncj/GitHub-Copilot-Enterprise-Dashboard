import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, Table2, FileJson, FileImage } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { buildRawRecordsCSV } from '../../../domain/export/csv.js';
import { buildNDJSON } from '../../../domain/export/ndjson.js';
import { buildAIUsageRawCSV } from '../../../domain/aiusage/export.js';
import { triggerDownload, captureFullPageAsPng } from '../../../../common/utils/download.js';

export function ExportMenu() {
  const { filteredData, rawData, valueConfig, activeView, aiUsageFiltered } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isUsage = activeView === 'aiusage';

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const exportCSV = () => {
    const csv = isUsage ? buildAIUsageRawCSV(aiUsageFiltered) : buildRawRecordsCSV(filteredData, valueConfig);
    triggerDownload(new Blob([csv], { type: 'text/csv' }), isUsage ? 'aiusage-raw.csv' : 'copilot-raw.csv');
    setOpen(false);
  };

  const exportNDJSON = () => {
    const ndjson = buildNDJSON(rawData);
    triggerDownload(new Blob([ndjson], { type: 'application/x-ndjson' }), 'copilot-consolidated.ndjson');
    setOpen(false);
  };

  const exportPNG = async () => {
    setOpen(false);
    await captureFullPageAsPng(isUsage ? 'aiusage-dashboard.png' : 'copilot-dashboard.png');
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="btn-secondary" onClick={() => setOpen(v => !v)}>
        <Download size={13} /> Export <ChevronDown size={11} />
      </button>
      {open && (
        <div style={{ position:'absolute',right:0,top:'calc(100% + 6px)',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-sm)',overflow:'hidden',zIndex:200,minWidth:'230px',boxShadow:'0 8px 24px rgba(0,0,0,0.6)' }}>
          <button className="export-menu-item" onClick={exportCSV}><Table2 size={13} /> Export Data CSV</button>
          {!isUsage && <button className="export-menu-item" onClick={exportNDJSON}><FileJson size={13} /> Export Consolidated NDJSON</button>}
          <button className="export-menu-item" onClick={exportPNG}><FileImage size={13} /> Export Full Page PNG</button>
        </div>
      )}
    </div>
  );
}
