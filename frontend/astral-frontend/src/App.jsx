import React from 'react';
import { AnalysisProvider, useAnalysis } from './context/AnalysisContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import OverviewPage from './pages/OverviewPage';
import DependencyPage from './pages/DependencyPage';
import CodeExplorerPage from './pages/CodeExplorerPage';
import OnboardingPage from './pages/OnboardingPage';
import HealthPage from './pages/HealthPage';

function AppContent() {
  const { state } = useAnalysis();
  const { activeView } = state;

  const renderPage = () => {
    switch (activeView) {
      case 'home':         return <HomePage />;
      case 'overview':     return <div className="content-area"><OverviewPage /></div>;
      case 'dependency':   return <div style={{ padding: '20px var(--gutter)', flex: 1 }}><DependencyPage /></div>;
      case 'onboarding':   return <div className="content-area"><OnboardingPage /></div>;
      case 'codeExplorer': return <div style={{ padding: '20px var(--gutter)', flex: 1 }}><CodeExplorerPage /></div>;
      case 'health':       return <div className="content-area"><HealthPage /></div>;
      default:             return <HomePage />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1, marginTop: 64 }}>
        {renderPage()}
      </main>
      <footer className="app-footer">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span>The Astral Cartographer · Webster 2026 (Team ID: 262 · DeDevelopers)</span>
          <span style={{ fontSize: 11, color: 'var(--color-outline)' }}>
            Shreya Chand (20253080) · Chanchal Sahu (20253079) · Prabhat Dubey (20253192)
          </span>
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            Backend: :5000 · Engine: :5050 · Tree-sitter & Babel AST · Cytoscape.js
          </span>
          <a href="https://github.com" target="_blank" rel="noreferrer"
            style={{ color: 'var(--color-on-surface-variant)', fontSize: 12 }}>
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AnalysisProvider>
      <AppContent />
    </AnalysisProvider>
  );
}
