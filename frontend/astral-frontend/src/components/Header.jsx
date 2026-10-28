import React from 'react';
import { useAnalysis } from '../context/AnalysisContext';

const VIEWS = [
  { key: 'home',         label: 'New Analysis' },
  { key: 'overview',     label: 'Overview & Stats' },
  { key: 'dependency',   label: 'Dependency Explorer' },
  { key: 'onboarding',   label: 'Onboarding Pathfinder' },
  { key: 'codeExplorer', label: 'Code Explorer' },
  { key: 'health',       label: 'Architecture Health' },
];

// Astral Cartographer SVG icon
function AstralIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="13" stroke="#4156ab" strokeWidth="1.5"/>
      <circle cx="14" cy="14" r="4" fill="#4156ab"/>
      <line x1="14" y1="1" x2="14" y2="8"  stroke="#4156ab" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="14" y1="20" x2="14" y2="27" stroke="#4156ab" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="1"  y1="14" x2="8"  y2="14" stroke="#4156ab" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="20" y1="14" x2="27" y2="14" stroke="#4156ab" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="4.22" y1="4.22" x2="9.17" y2="9.17" stroke="#98a9ff" strokeWidth="1" strokeLinecap="round"/>
      <line x1="18.83" y1="18.83" x2="23.78" y2="23.78" stroke="#98a9ff" strokeWidth="1" strokeLinecap="round"/>
      <line x1="23.78" y1="4.22" x2="18.83" y2="9.17" stroke="#98a9ff" strokeWidth="1" strokeLinecap="round"/>
      <line x1="9.17" y1="18.83" x2="4.22" y2="23.78" stroke="#98a9ff" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  );
}

export default function Header() {
  const { state, setView } = useAnalysis();
  const { activeView, result, status } = state;

  const hasResult = result !== null;
  const cycleCount = result?.architecture?.circularCycles?.length ?? 0;
  const healthScore = result?.architecture?.summary?.healthScore ?? null;

  return (
    <header className="app-header">
      {/* Logo and Team Branding */}
      <button className="app-header-logo" onClick={() => setView('home')}>
        <AstralIcon />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
          <span className="app-header-title">The Astral Cartographer</span>
          <span style={{ fontSize: 9, color: 'var(--color-outline)', fontWeight: 600, letterSpacing: '0.04em' }}>
            Webster 2026 · Team 262: DeDevelopers
          </span>
        </div>
      </button>

      {/* Context breadcrumb */}
      {hasResult && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontFamily: 'var(--font-mono)', fontSize: '11px',
          padding: '4px 10px', background: 'var(--color-surface-container)',
          borderRadius: 'var(--radius-full)', color: 'var(--color-on-surface)',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-emerald)', display: 'inline-block' }} />
          <span style={{ fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {result.repository?.fullName || 'analysis'}
          </span>
        </div>
      )}

      {/* Navigation tabs */}
      <nav className="app-nav" style={{ flex: 1, justifyContent: 'center' }}>
        {VIEWS.map((v) => {
          if (!hasResult && v.key !== 'home') return null;
          return (
            <button
              key={v.key}
              className={`nav-link${activeView === v.key ? ' active' : ''}`}
              onClick={() => setView(v.key)}
            >
              {v.label}
              {v.key === 'health' && cycleCount > 0 && (
                <span className="pill pill-warn" style={{ marginLeft: 4 }}>
                  {cycleCount} cycle{cycleCount > 1 ? 's' : ''}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {healthScore !== null && (
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
            padding: '3px 10px', borderRadius: 'var(--radius-full)',
            background: healthScore >= 80 ? 'rgba(16,185,129,0.1)' : healthScore >= 50 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
            color: healthScore >= 80 ? '#047857' : healthScore >= 50 ? '#b45309' : '#b91c1c',
          }}>
            Health {healthScore}/100
          </div>
        )}
        {status === 'loading' && (
          <div className="spinner" />
        )}
      </div>
    </header>
  );
}
