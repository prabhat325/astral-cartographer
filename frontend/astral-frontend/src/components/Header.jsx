import React from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import { 
  LayoutDashboard, 
  Network, 
  FileCode2, 
  Activity, 
  PlusCircle, 
  GitBranch,
  Layers,
  Menu
} from 'lucide-react';

const TOP_VIEWS = [
  { key: 'home',         label: 'New Analysis',        icon: PlusCircle },
  { key: 'overview',     label: 'Overview',            icon: LayoutDashboard },
  { key: 'dependency',   label: 'Dependency Graph',    icon: Network },
  { key: 'callGraph',    label: 'Call Graph',          icon: Layers },
  { key: 'codeExplorer', label: 'Code Explorer',       icon: FileCode2 },
  { key: 'health',       label: 'Health',              icon: Activity },
];

/* ── Royal Astrolabe Emblem ── */
function RoyalAstralLogo() {
  return (
    <div style={{ position: 'relative', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
        <circle cx="17" cy="17" r="16" stroke="#D4AF70" strokeWidth="1.5" fill="#FFF9F5" />
        <circle cx="17" cy="17" r="11" stroke="#A98245" strokeWidth="1" strokeDasharray="3 2" fill="#F8F1E8" />
        <circle cx="17" cy="17" r="5" fill="#432832" />
        <line x1="17" y1="1" x2="17" y2="7" stroke="#A98245" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="17" y1="27" x2="17" y2="33" stroke="#A98245" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="1" y1="17" x2="7" y2="17" stroke="#A98245" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="27" y1="17" x2="33" y2="17" stroke="#A98245" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="17" cy="17" r="1.5" fill="#FFF9F5" />
      </svg>
      <div style={{
        position: 'absolute',
        top: -2,
        right: -2,
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: '#D4AF70',
        boxShadow: '0 0 8px #D4AF70'
      }} />
    </div>
  );
}

export default function Header() {
  const { state, setView, toggleSidebar } = useAnalysis();
  const { activeView, result, status } = state;

  const hasResult = result !== null;
  const cycleCount = result?.architecture?.circularCycles?.length ?? 0;
  const healthScore = result?.architecture?.summary?.healthScore ?? null;

  return (
    <header className="app-header">
      {/* Royal Logo & Mobile Menu Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {hasResult && (
          <button
            type="button"
            className="btn-icon mobile-menu-btn"
            onClick={toggleSidebar}
            title="Toggle Navigation Menu"
          >
            <Menu size={18} color="var(--color-antique-gold)" />
          </button>
        )}

        <button className="app-logo-btn" onClick={() => setView('home')}>
          <RoyalAstralLogo />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="app-logo-text">Astral Cartographer</span>
              <span className="app-logo-badge">Royal Edition</span>
            </div>
          </div>
        </button>

        {/* Current Repository Breadcrumb */}
        {hasResult && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 12px',
            background: 'var(--color-pearl-white)',
            border: '1px solid var(--border-gold-solid)',
            borderRadius: 'var(--radius-full)',
            boxShadow: '0 2px 6px rgba(212, 175, 112, 0.15)',
          }}>
            <GitBranch size={13} color="var(--color-antique-gold)" />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11.5px',
              fontWeight: 600,
              color: 'var(--color-deep-burgundy)'
            }}>
              {result.repository?.fullName || result.repository?.name || 'repository'}
            </span>
          </div>
        )}
      </div>

      {/* Top Navigation Links */}
      <nav className="app-nav">
        {TOP_VIEWS.map((v) => {
          if (!hasResult && v.key !== 'home') return null;
          const Icon = v.icon;
          const isActive = activeView === v.key;

          return (
            <button
              key={v.key}
              className={`nav-link${isActive ? ' active' : ''}`}
              onClick={() => setView(v.key)}
            >
              <Icon size={15} color={isActive ? 'var(--color-antique-gold)' : 'var(--text-secondary)'} />
              <span>{v.label}</span>
              {v.key === 'health' && cycleCount > 0 && (
                <span className="pill pill-rose" style={{ height: 18, fontSize: 10, padding: '0 6px', marginLeft: 2 }}>
                  {cycleCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Actions & Health Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {status === 'loading' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-pearl-white)', padding: '4px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-gold-subtle)' }}>
            <div className="spinner" style={{ width: 14, height: 14 }} />
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-antique-gold)' }}>Synthesizing…</span>
          </div>
        )}

        {healthScore !== null && (
          <div 
            onClick={() => setView('health')}
            title="Click to view full architecture health analysis"
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 14px',
              borderRadius: 'var(--radius-full)',
              background: healthScore >= 80 ? 'rgba(34, 139, 88, 0.08)' : healthScore >= 50 ? 'rgba(183, 121, 31, 0.08)' : 'rgba(185, 56, 85, 0.08)',
              border: `1.5px solid ${healthScore >= 80 ? '#228B58' : healthScore >= 50 ? '#D4AF70' : '#B93855'}`,
              color: healthScore >= 80 ? '#228B58' : healthScore >= 50 ? '#A98245' : '#B93855',
              fontFamily: 'var(--font-mono)',
              fontSize: '11.5px',
              fontWeight: 700,
              boxShadow: '0 2px 6px rgba(67, 40, 50, 0.04)'
            }}
          >
            <Activity size={12} />
            <span>Health {healthScore}/100</span>
          </div>
        )}

        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="btn-icon"
          title="GitHub Integration"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
          </svg>
        </a>
      </div>
    </header>
  );
}
