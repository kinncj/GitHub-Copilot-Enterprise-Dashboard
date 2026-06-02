import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { Header } from '../dashboard/Header.jsx';
import { ViewTabs } from '../shared/ViewTabs.jsx';
import { SectionDivider } from '../shared/SectionDivider.jsx';
import { AIUsageKpiSection } from './AIUsageKpiSection.jsx';
import { AIUsageFilterBar } from './AIUsageFilterBar.jsx';
import { AIUsageInsightsPanel } from './AIUsageInsightsPanel.jsx';
import { AIUsageTable } from './AIUsageTable.jsx';
import { BudgetSummary } from './BudgetSummary.jsx';
import { LicenseConfig } from './LicenseConfig.jsx';
import { BudgetBreakdownTable } from './BudgetBreakdownTable.jsx';
import { CreditsOverTime } from '../../charts/aiusage/CreditsOverTime.jsx';
import { TopUsersByCredits } from '../../charts/aiusage/TopUsersByCredits.jsx';
import { QuotaUtilization } from '../../charts/aiusage/QuotaUtilization.jsx';
import { MetricDoughnut } from '../../charts/aiusage/MetricDoughnut.jsx';
import { BudgetProjection } from '../../charts/aiusage/BudgetProjection.jsx';
import { OrgBudgetUtilization } from '../../charts/aiusage/OrgBudgetUtilization.jsx';
import { ProjectedQuotaOverage } from '../../charts/aiusage/ProjectedQuotaOverage.jsx';

export function AIUsageDashboard() {
  const { aiUsageAggregated } = useApp();
  const { byModel = {}, byOrg = {}, byCostCenter = {}, bySku = {} } = aiUsageAggregated;

  // Auto-routed vs explicitly-picked credits, as a 2-slice bucket.
  const autoVsManual = useMemo(() => {
    let auto = 0, manual = 0;
    for (const m of Object.values(byModel)) { auto += m.auto; manual += m.manual; }
    return { 'Auto-routed': { credits: auto, gross: 0 }, 'Explicit': { credits: manual, gross: 0 } };
  }, [byModel]);

  return (
    <div style={{ position:'relative',zIndex:1,maxWidth:'1280px',margin:'0 auto',padding:'calc(52px + 1.5rem) 1.5rem calc(36px + 1.5rem)' }}>
      <Header />
      <ViewTabs />
      <AIUsageFilterBar />
      <div className="mb-8">
        <AIUsageKpiSection />
      </div>

      {/* ── Budget & burn rate: individual → org → enterprise ── */}
      <div className="mb-2">
        <BudgetSummary />
      </div>
      <LicenseConfig />
      <div className="grid grid-cols-1 gap-6 mb-6">
        <BudgetProjection />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <OrgBudgetUtilization />
        <ProjectedQuotaOverage />
      </div>
      <SectionDivider icon="wallet" label="Budget Breakdown — Used vs Allotted" />
      <BudgetBreakdownTable level="org" />
      <BudgetBreakdownTable level="user" />

      <SectionDivider icon="dollar-sign" label="Consumption Over Time" />
      <div className="grid grid-cols-1 gap-6 mb-6">
        <CreditsOverTime aggregatedData={aiUsageAggregated} />
      </div>

      <SectionDivider icon="users" label="By User" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TopUsersByCredits aggregatedData={aiUsageAggregated} />
        <QuotaUtilization aggregatedData={aiUsageAggregated} />
      </div>

      <SectionDivider icon="cpu" label="By Model" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <MetricDoughnut title="Credits by Model" subtitle="Share of credits per model (auto prefix merged)" bucket={byModel} metric="credits" filename="credits-by-model" />
        <MetricDoughnut title="Auto-Routed vs Explicit" subtitle="Credits on auto-selected models vs explicit picks" bucket={autoVsManual} metric="credits" filename="auto-vs-explicit" />
      </div>

      <SectionDivider icon="building-2" label="By Org, Cost Center & SKU" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <MetricDoughnut title="Spend by Organization" subtitle="Gross $ per organization" bucket={byOrg} metric="gross" filename="spend-by-org" />
        <MetricDoughnut title="Spend by Cost Center" subtitle="Gross $ per cost center" bucket={byCostCenter} metric="gross" filename="spend-by-cost-center" />
        <MetricDoughnut title="Credits by SKU" subtitle="Chat/completions vs coding-agent credits" bucket={bySku} metric="credits" filename="credits-by-sku" />
      </div>

      <AIUsageInsightsPanel />
      <AIUsageTable />
    </div>
  );
}
