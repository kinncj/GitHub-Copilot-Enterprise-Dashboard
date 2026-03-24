import React from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { App } from './presentation/components/App.jsx';
import './presentation/styles/global.css';

const theme = createTheme({
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
  primaryColor: 'green',
  colors: {
    green: [
      '#e6faf5', '#b3f0e0', '#80e6cb', '#4ddcb6', '#1ad2a1',
      '#00C896', '#009e78', '#00785a', '#00503c', '#00281e',
    ],
  },
});

createRoot(document.getElementById('root')).render(
  <MantineProvider theme={theme} defaultColorScheme="dark">
    <App />
  </MantineProvider>
);
