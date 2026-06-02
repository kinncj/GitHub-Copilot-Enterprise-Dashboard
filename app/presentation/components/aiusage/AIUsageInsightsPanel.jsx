import React, { useRef } from 'react';
import { Lightbulb } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { InsightCard } from '../insights/InsightCard.jsx';
import { captureElementAsPng } from '../../../../common/utils/download.js';

export function AIUsageInsightsPanel() {
  const { aiUsageInsights } = useApp();
  const panelRef = useRef(null);

  return (
    <div className="card mb-6" ref={panelRef}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
          <Lightbulb size={20} color="var(--green)" />
          Insights &amp; Anomalies
        </h3>
        <button className="btn-secondary text-xs" onClick={() => captureElementAsPng(panelRef.current, 'aiusage-insights.png')}>PNG</button>
      </div>
      {aiUsageInsights.length === 0 ? (
        <p style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>No insights available for this date range.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiUsageInsights.map((insight, i) => <InsightCard key={i} {...insight} />)}
        </div>
      )}
    </div>
  );
}
