import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { Header } from './Header.jsx';
import { FilterBar } from './FilterBar.jsx';
import { KpiSection } from '../kpi/KpiSection.jsx';
import { InsightsPanel } from '../insights/InsightsPanel.jsx';
import { DataTable } from '../table/DataTable.jsx';
import { MetricsGlossary } from '../glossary/MetricsGlossary.jsx';
import { ValueConfig } from '../config/ValueConfig.jsx';
import { SectionDivider } from '../shared/SectionDivider.jsx';
// Charts
import { ActivityTimeline } from '../../charts/ActivityTimeline.jsx';
import { LoCTrend } from '../../charts/LoCTrend.jsx';
import { AcceptanceRateTrend } from '../../charts/AcceptanceRateTrend.jsx';
import { DailyActiveUsers } from '../../charts/DailyActiveUsers.jsx';
import { TopUsersByGenerations } from '../../charts/TopUsersByGenerations.jsx';
import { TopUsersByLoC } from '../../charts/TopUsersByLoC.jsx';
import { EfficiencyMatrix } from '../../charts/EfficiencyMatrix.jsx';
import { UserEngagement } from '../../charts/UserEngagement.jsx';
import { IDEMarketShare } from '../../charts/IDEMarketShare.jsx';
import { IDEAcceptanceRate } from '../../charts/IDEAcceptanceRate.jsx';
import { LanguageDistribution } from '../../charts/LanguageDistribution.jsx';
import { LanguageAcceptanceRate } from '../../charts/LanguageAcceptanceRate.jsx';
import { FeatureUsage } from '../../charts/FeatureUsage.jsx';
import { ModelDistribution } from '../../charts/ModelDistribution.jsx';

export function Dashboard() {
  const { aggregatedData } = useApp();

  return (
    <div style={{ position:'relative',zIndex:1,maxWidth:'1280px',margin:'0 auto',padding:'1.5rem 1.5rem 3rem' }}>
      <Header />
      <FilterBar />
      <div className="mb-8">
        <KpiSection />
      </div>
      <MetricsGlossary />
      <ValueConfig />

      <SectionDivider icon="activity" label="Activity & Time" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ActivityTimeline aggregatedData={aggregatedData} />
        <LoCTrend aggregatedData={aggregatedData} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <AcceptanceRateTrend aggregatedData={aggregatedData} />
        <DailyActiveUsers aggregatedData={aggregatedData} />
      </div>

      <SectionDivider icon="users" label="User Analysis" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TopUsersByGenerations aggregatedData={aggregatedData} />
        <TopUsersByLoC aggregatedData={aggregatedData} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <EfficiencyMatrix aggregatedData={aggregatedData} />
        <UserEngagement aggregatedData={aggregatedData} />
      </div>

      <SectionDivider icon="code-2" label="Tools & Languages" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <IDEMarketShare aggregatedData={aggregatedData} />
        <LanguageDistribution aggregatedData={aggregatedData} />
        <FeatureUsage aggregatedData={aggregatedData} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <IDEAcceptanceRate aggregatedData={aggregatedData} />
        <LanguageAcceptanceRate aggregatedData={aggregatedData} />
        <ModelDistribution aggregatedData={aggregatedData} />
      </div>

      <InsightsPanel />
      <DataTable />
    </div>
  );
}
