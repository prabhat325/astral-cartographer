import React from 'react';
import { AnalysisProvider, useAnalysis } from './context/AnalysisContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import OverviewPage from './pages/OverviewPage';
import DependencyPage from './pages/DependencyPage';
import CodeExplorerPage from './pages/CodeExplorerPage';
import HealthPage from './pages/HealthPage';
import HotspotsPage from './pages/HotspotsPage';
import CircularPage from './pages/CircularPage';
import OnboardingPage from './pages/OnboardingPage';
import { Sparkles, Radio } from 'lucide-react';

function AppContent() {
  const { state } = useAnalysis();
  const { activeView, result } = state;

  const hasResult = result !== null && activeView !== 'home';

  const renderPage = () => {
    switch (activeView) {
      case 'home':
        return <HomePage />;
      case 'overview':
        return (
          <div style={{ padding: '0 var(--gutter)', flex: 1 }}>
            <OverviewPage />
          </div>
        );
      case 'dependency':
      case 'callGraph':
        return (
          <div style={{ padding: '24px var(--gutter)', flex: 1 }}>
            <DependencyPage />
          </div>
        );
      case 'hotspots':
        return (
          <div style={{ padding: '0 var(--gutter)', flex: 1 }}>
            <HotspotsPage />
          </div>
        );
      case 'circular':
        return (
          <div style={{ padding: '0 var(--gutter)', flex: 1 }}>
            <CircularPage />
          </div>
        );
      case 'onboarding':
        return (
          <div style={{ padding: '0 var(--gutter)', flex: 1 }}>
            <OnboardingPage />
          </div>
        );
      case 'codeExplorer':
        return (
          <div style={{ padding: '24px var(--gutter)', flex: 1 }}>
            <CodeExplorerPage />
          </div>
        );
      case 'health':
        return (
          <div style={{ padding: '0 var(--gutter)', flex: 1 }}>
            <HealthPage />
          </div>
        );
      default:
        return <HomePage />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1, display: 'flex', marginTop: 68 }}>
        {hasResult && <Sidebar />}
        <main style={{ flex: 1, minWidth: 0, overflowX: 'hidden' }}>
          {renderPage()}
        </main>
      </div>
      <footer className="app-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={14} color="var(--color-antique-gold)" />
          <span style={{ fontWeight: 600, color: 'var(--color-deep-burgundy)' }}>
            Astral Cartographer
          </span>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <span>Imperial Architectural Cartography</span>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
            background: 'var(--color-warm-ivory)',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-gold-subtle)'
          }}>
            <Radio size={10} color="var(--color-antique-gold)" className="pulse-gold" />
            <span>github-service :5000 · analyzer :5050 · Babel AST Engine</span>
          </div>

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            style={{
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
            </svg>
            <span>GitHub</span>
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
