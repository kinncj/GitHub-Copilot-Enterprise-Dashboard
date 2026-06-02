import React from 'react';
import { AppContext } from '../context/AppContext.jsx';
import { useAppState } from '../../state/useAppState.js';
import { UploadZone } from './upload/UploadZone.jsx';
import { ProgressBar } from './progress/ProgressBar.jsx';
import { Dashboard } from './dashboard/Dashboard.jsx';
import { AIUsageDashboard } from './aiusage/AIUsageDashboard.jsx';
import { Footer } from './shared/Footer.jsx';

export function App() {
  const appState = useAppState();
  const { loading, hasActivity, hasAIUsage, activeView } = appState;

  // When only AI Usage is loaded, show it regardless of the stored view.
  const showAIUsage = hasAIUsage && (activeView === 'aiusage' || !hasActivity);

  return (
    <AppContext.Provider value={appState}>
      {loading
        ? <ProgressBar />
        : !hasActivity && !hasAIUsage
          ? <UploadZone />
          : showAIUsage
            ? <AIUsageDashboard />
            : <Dashboard />}
      <Footer />
    </AppContext.Provider>
  );
}
