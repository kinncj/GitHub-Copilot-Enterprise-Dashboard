import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

const GLOSSARY = [
  {
    term: 'Generation',
    def: 'One Copilot trigger — a completion suggestion, chat reply, or agent action. Tracked by code_generation_activity_count.'
  },
  {
    term: 'Acceptance',
    def: 'A completion that the user accepted (pressed Tab / Apply). Only tracked for code_completion mode. Agent and chat modes do not generate acceptance events.'
  },
  {
    term: 'Acceptance Rate',
    def: 'Acceptances ÷ Generations. Only meaningful for code_completion users. ~94% of activity is agent/chat, which never records acceptances — a "low" overall rate is expected and normal.'
  },
  {
    term: 'Lines Added / Deleted',
    def: 'loc_added_sum and loc_deleted_sum — lines that Copilot inserted or removed. Deleted lines usually come from agent-mode refactors.'
  },
  {
    term: 'Net Lines',
    def: 'loc_added_sum − loc_deleted_sum. Positive = net new code. Negative = Copilot was used to shrink the codebase (cleanup, dead-code removal).'
  },
  {
    term: 'Value Estimate',
    def: 'A rough dollar proxy: (lines / MANUAL_LINES_PER_HOUR) × BLENDED_RATE_PER_HOUR. Not an ROI figure — just a way to express scale in familiar units. Change the defaults in the config panel.'
  },
  {
    term: 'Active Time (minutes)',
    def: 'active_time_minutes from the export — time the user was actively using Copilot, not total IDE time.'
  },
  {
    term: 'Power User',
    def: 'Top 10% of users by generation count in the filtered period.'
  }
];

export function MetricsGlossary() {
  const [open, setOpen] = useState(false);

  return (
    <div className="card mb-6">
      <button
        onClick={() => setOpen(v => !v)}
        style={{ display:'flex',justifyContent:'space-between',alignItems:'center',width:'100%',background:'none',border:'none',cursor:'pointer',color:'var(--text-1)',padding:0 }}
      >
        <span style={{ display:'flex',alignItems:'center',gap:'0.5rem',fontWeight:600,fontSize:'0.9rem' }}>
          <BookOpen size={16} color="var(--green)" />
          Understanding Your Metrics
        </span>
        {open ? <ChevronUp size={16} color="var(--text-2)" /> : <ChevronDown size={16} color="var(--text-2)" />}
      </button>
      {open && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {GLOSSARY.map(g => (
            <div key={g.term} className="glossary-item">
              <dt style={{ fontWeight:600,fontSize:'0.8rem',color:'var(--green)',marginBottom:'0.25rem' }}>{g.term}</dt>
              <dd style={{ fontSize:'0.78rem',color:'var(--text-2)',lineHeight:1.6,margin:0 }}>{g.def}</dd>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
