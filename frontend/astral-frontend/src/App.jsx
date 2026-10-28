import React from 'react';
import { AnalysisProvider, useAnalysis } from './context/AnalysisContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import OverviewPage from './pages/OverviewPage';
import DependencyPage from './pages/DependencyPage';
import CodeExplorerPage from './pages/CodeExplorerPage';
import HealthPage from './pages/HealthPage';

function AppContent() {
  const { state } = useAnalysis();
  const { activeView } = state;

  const renderPage = () => {
    switch (activeView) {
      case 'home':         return <HomePage />;
      case 'overview':     return <div className="content-area"><OverviewPage /></div>;
      case 'dependency':   return <div style={{ padding: '24px var(--gutter)', flex: 1 }}><DependencyPage /></div>;
      case 'codeExplorer': return <div style={{ padding: '24px var(--gutter)', flex: 1 }}><CodeExplorerPage /></div>;
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
        <span>Astral Cartographer · Architecture Intelligence Engine</span>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            github-service :5000 · analyzer :5050
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
