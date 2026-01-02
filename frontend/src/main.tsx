/**
 * NFL Games SPA - Entry Point
 *
 * V1-Spec Compliant:
 * - Uses StandaloneApp for local development
 * - Dashboard components exported via Module Federation
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { StandaloneApp } from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <StandaloneApp />
  </StrictMode>
);
