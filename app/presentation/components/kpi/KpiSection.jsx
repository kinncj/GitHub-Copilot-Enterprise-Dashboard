import React, { useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { KpiCard } from './KpiCard.jsx';
import { FeatureAdoptionCard } from './FeatureAdoptionCard.jsx';
import { SectionDivider } from '../shared/SectionDivider.jsx';
import { formatNumber } from '../../../../common/utils/format.js';
import { humanizeFeature } from '../../../../common/utils/format.js';
import { buildActivityKpiCSV, buildLocKpiCSV, buildFeatureAdoptionCSV } from '../../../domain/export/csv.js';
import { triggerDownload, captureElementAsPng } from '../../../../common/utils/download.js';

const FEATURE_ACCENTS = [
  '#818cf8', '#34d399', '#f59e0b', '#60a5fa', '#a78bfa', '#f87171', '#fb923c', '#4ade80'
];

export function KpiSection() {
  const { aggregatedData, valueConfig } = useApp();
  const activityRef  = useRef(null);
  const locRef       = useRef(null);
  const codeGenRef   = useRef(null);
  const featuresRef  = useRef(null);
  const { byUser, byDay, byFeature } = aggregatedData;

  if (!byUser || !byDay) return null;

  const { MANUAL_LINES_PER_HOUR, BLENDED_RATE_PER_HOUR } = valueConfig;

  // Activity KPIs
  const totalUsers       = Object.keys(byUser).length;
  const totalGenerations = Object.values(byUser).reduce((s, u) => s + u.generations, 0);
  const totalAcceptances = Object.values(byUser).reduce((s, u) => s + u.acceptances, 0);
  const acceptanceRate   = totalGenerations > 0 ? ((totalAcceptances / totalGenerations) * 100).toFixed(1) : '0.0';
  const chatCount        = (byFeature?.['chat']?.generations || 0) + (byFeature?.['chat_inline']?.generations || 0) + (byFeature?.['inline_chat']?.generations || 0);
  const activeDays       = Object.keys(byDay).length;
  const avgDailyUsers    = activeDays > 0
    ? (Object.values(byDay).reduce((s, d) => s + d.activeUsers, 0) / activeDays).toFixed(1)
    : '0';

  // LoC KPIs
  const linesAdded   = Object.values(byUser).reduce((s, u) => s + u.linesAdded, 0);
  const linesDeleted = Object.values(byUser).reduce((s, u) => s + u.linesDeleted, 0);
  const netLines     = linesAdded - linesDeleted;
  const totalMinutes = Object.values(byUser).reduce((s, u) => s + u.activeTime, 0);
  const hours        = totalMinutes / 60;

  const valueCalc = lines => (lines / MANUAL_LINES_PER_HOUR) * BLENDED_RATE_PER_HOUR;
  const fmtCurrency = v => v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v.toFixed(0)}`;

  const netValue       = valueCalc(netLines);
  const addedValue     = valueCalc(linesAdded);
  const totalChangedVal = valueCalc(linesAdded + linesDeleted);

  // Code generation KPIs
  const linesChangedWithAI = linesAdded + linesDeleted;
  const totalSuggested     = Object.values(byUser).reduce((s, u) => s + (u.locSuggested || 0), 0);
  const lineAcceptRate     = totalSuggested > 0 ? ((linesAdded / totalSuggested) * 100).toFixed(1) : null;
  const AGENT_FEATURES     = new Set(['agent', 'agent_edit', 'chat_panel_agent_mode', 'chat_panel_plan_mode', 'chat_panel_custom_mode']);
  const agentGens          = Object.entries(byFeature || {}).filter(([k]) => AGENT_FEATURES.has(k)).reduce((s, [, d]) => s + d.generations, 0);
  const agentContrib       = totalGenerations > 0 ? ((agentGens / totalGenerations) * 100).toFixed(1) : '0.0';
  const avgLinesDeletedPerUser = totalUsers > 0 ? Math.round(linesDeleted / totalUsers) : 0;

  // Feature adoption
  const usersByFeature = {};
  for (const u of Object.values(byUser)) {
    for (const f of u.features) {
      usersByFeature[f] = (usersByFeature[f] || 0) + 1;
    }
  }

  const featureCards = Object.entries(byFeature || {})
    .sort((a, b) => b[1].generations - a[1].generations)
    .map(([key], i) => {
      const { label, desc } = humanizeFeature(key);
      const count = usersByFeature[key] || 0;
      const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
      return { key, label, desc, pct, count, accent: FEATURE_ACCENTS[i % FEATURE_ACCENTS.length] };
    });

  const downloadActivityCSV = () => {
    const csv = buildActivityKpiCSV(aggregatedData);
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'kpi-activity.csv');
  };
  const downloadLocCSV = () => {
    const csv = buildLocKpiCSV(aggregatedData, valueConfig);
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'kpi-loc.csv');
  };
  const downloadFeatureCSV = () => {
    const csv = buildFeatureAdoptionCSV(aggregatedData);
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'kpi-features.csv');
  };
  const downloadCodeGenCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Lines Changed with AI', linesChangedWithAI],
      ['Agent Contribution %', agentContrib],
      ['Avg Lines Deleted / User', avgLinesDeletedPerUser],
      ['Line Acceptance Rate %', lineAcceptRate ?? 'n/a'],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'kpi-code-generation.csv');
  };

  return (
    <div>
      {/* Activity section */}
      <div ref={activityRef}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem' }}>
          <SectionDivider icon="activity" label="Activity" />
          <div style={{ display:'flex',gap:'0.4rem' }}>
            <button className="btn-secondary" style={{ fontSize:'0.72rem' }} onClick={downloadActivityCSV}>CSV</button>
            <button className="btn-secondary" style={{ fontSize:'0.72rem' }} onClick={() => captureElementAsPng(activityRef.current, 'kpi-activity.png')}>PNG</button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <KpiCard
            label="Total Users"
            value={formatNumber(totalUsers)}
            subtitle="Unique users in date range"
            tooltip="Distinct user_login values across all filtered records."
          />
          <KpiCard
            label="Total Generations"
            value={formatNumber(totalGenerations)}
            subtitle="Copilot triggers (all modes)"
            tooltip="Sum of code_generation_activity_count across all records. Includes completions, chat, and agent mode."
          />
          <KpiCard
            label="Acceptance Rate"
            value={acceptanceRate + '%'}
            subtitle="Completions only — agent mode excluded"
            tooltip="Acceptances / Generations. Only meaningful for code_completion; agent mode doesn't track acceptances."
          />
          <KpiCard
            label="Chat & Inline"
            value={formatNumber(chatCount)}
            subtitle="Chat + inline chat interactions"
            tooltip="Sum of generations from chat, chat_inline, and inline_chat features."
          />
          <KpiCard
            label="Avg Daily Users"
            value={avgDailyUsers}
            subtitle={`Over ${activeDays} active days`}
            tooltip="Mean unique users per active day in the filtered date range."
          />
        </div>
      </div>

      {/* Lines of Code section */}
      <div ref={locRef}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem' }}>
          <SectionDivider icon="activity" label="Lines of Code" />
          <div style={{ display:'flex',gap:'0.4rem' }}>
            <button className="btn-secondary" style={{ fontSize:'0.72rem' }} onClick={downloadLocCSV}>CSV</button>
            <button className="btn-secondary" style={{ fontSize:'0.72rem' }} onClick={() => captureElementAsPng(locRef.current, 'kpi-loc.png')}>PNG</button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <KpiCard
            label="Lines Added"
            value={formatNumber(linesAdded)}
            subtitle="Total loc_added_sum"
            tooltip="Sum of lines inserted by Copilot across all records."
          />
          <KpiCard
            label="Lines Deleted"
            value={formatNumber(linesDeleted)}
            subtitle="Total loc_deleted_sum"
            tooltip="Sum of lines removed by Copilot (agent refactors, cleanups)."
          />
          <KpiCard
            label="Net Lines"
            value={formatNumber(netLines)}
            subtitle="Added minus deleted"
            tooltip="Net change in codebase size: loc_added_sum - loc_deleted_sum."
          />
          <KpiCard
            label="Value (Net)"
            value={fmtCurrency(netValue)}
            subtitle={`@ $${BLENDED_RATE_PER_HOUR}/hr, ${MANUAL_LINES_PER_HOUR} lines/hr`}
            tooltip="Estimated value of net lines produced: (net / MANUAL_LINES_PER_HOUR) × BLENDED_RATE_PER_HOUR."
          />
          <KpiCard
            label="Active Hours"
            value={formatNumber(Math.round(hours))}
            subtitle="Total active_time_minutes / 60"
            tooltip="Sum of active_time_minutes across all records, converted to hours."
          />
        </div>
      </div>

      {/* Code Generation section */}
      <div ref={codeGenRef}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem' }}>
          <SectionDivider icon="activity" label="Code Generation" />
          <div style={{ display:'flex',gap:'0.4rem' }}>
            <button className="btn-secondary" style={{ fontSize:'0.72rem' }} onClick={downloadCodeGenCSV}>CSV</button>
            <button className="btn-secondary" style={{ fontSize:'0.72rem' }} onClick={() => captureElementAsPng(codeGenRef.current, 'kpi-code-generation.png')}>PNG</button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard
            label="Lines Changed with AI"
            value={formatNumber(linesChangedWithAI)}
            subtitle="Lines added + deleted across all modes"
            tooltip="Total lines of code touched by Copilot: loc_added_sum + loc_deleted_sum. GitHub's headline metric for code generation volume."
          />
          <KpiCard
            label="Agent Contribution"
            value={agentContrib + '%'}
            subtitle="Share of triggers from agent features"
            tooltip="Generations from agent, edit, and agentic chat modes divided by total generations. Proxy for how much activity is autonomous vs inline suggestion."
          />
          <KpiCard
            label="Avg Lines Deleted / User"
            value={formatNumber(avgLinesDeletedPerUser)}
            subtitle="Agent-assisted removals per active user"
            tooltip="Total lines deleted divided by unique users. High values indicate active refactoring and cleanup via Copilot."
          />
          {lineAcceptRate !== null && (
            <KpiCard
              label="Line Acceptance Rate"
              value={lineAcceptRate + '%'}
              subtitle="Lines applied vs lines suggested"
              tooltip="loc_added_sum / loc_suggested_to_add_sum. How much of what Copilot offered was actually kept. Only available when the export includes loc_suggested_to_add_sum."
            />
          )}
        </div>
      </div>

      {/* Feature adoption section */}
      {featureCards.length > 0 && (
        <div ref={featuresRef}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem' }}>
            <SectionDivider icon="activity" label="Feature Adoption" />
            <div style={{ display:'flex',gap:'0.4rem' }}>
              <button className="btn-secondary" style={{ fontSize:'0.72rem' }} onClick={downloadFeatureCSV}>CSV</button>
              <button className="btn-secondary" style={{ fontSize:'0.72rem' }} onClick={() => captureElementAsPng(featuresRef.current, 'kpi-features.png')}>PNG</button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {featureCards.map(fc => (
              <FeatureAdoptionCard
                key={fc.key}
                label={fc.label}
                pct={fc.pct}
                userCount={fc.count}
                desc={fc.desc}
                accent={fc.accent}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
