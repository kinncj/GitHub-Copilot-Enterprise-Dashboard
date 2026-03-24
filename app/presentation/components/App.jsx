import React from 'react';
import { AppContext } from '../context/AppContext.jsx';
import { useAppState } from '../../state/useAppState.js';
import { UploadZone } from './upload/UploadZone.jsx';
import { ProgressBar } from './progress/ProgressBar.jsx';
import { Dashboard } from './dashboard/Dashboard.jsx';
import { Footer } from './shared/Footer.jsx';

export function App() {
  const appState = useAppState();
  const { loading, rawData } = appState;

  return (
    <AppContext.Provider value={appState}>
      {loading
        ? <ProgressBar />
        : rawData.length === 0
          ? <UploadZone />
          : <Dashboard />}
      <Footer />
    </AppContext.Provider>
  );
}
