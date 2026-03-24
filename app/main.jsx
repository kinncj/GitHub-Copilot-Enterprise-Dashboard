import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './presentation/components/App.jsx';
import './presentation/styles/global.css';

createRoot(document.getElementById('root')).render(<App />);
