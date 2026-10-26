import React, { useMemo } from 'react';
import { useAnalysis } from '../context/AnalysisContext';

function HealthRing({ score }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const filled = (score / 100) * circumference;
  const color = score >= 80 ? 'var(--color-emerald)' : score >= 50 ? 'var(--color-amber)' : 'var(--color-coral)';
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--color-surface-container)" strokeWidth="12" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12"
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '70px 70px', transition: 'stroke-dasharray 0.8s ease' }}
      />
      <text x="70" y="65" textAnchor="middle" dominantBaseline="middle"
        style={{ fontFamily: 'var(--font-sans)', fontSize: 26, fontWeight: 700, fill: 'var(--color-on-surface)' }}>
        {score}
      </text>
      <text x="70" y="85" textAnchor="middle"
        style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fill: 'var(--color-on-surface-variant)' }}>
        / 100
      </text>
    </svg>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card fade-in">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={color ? { color } : {}}>{value}</div>
      {sub && <div className="stat-meta">{sub}</div>}
    </div>
  );
}

function MetricRow({ label, value, max = 100, color = 'var(--color-primary)' }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: 'var(--color-on-surface-variant)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-on-surface)' }}>{value}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

const EMPTY_ARR = [];

export default function OverviewPage() {
  const { state, setView } = useAnalysis();
  const { result } = state;

  const repository = result?.repository;
  const architecture = result?.architecture;
  const summary = architecture?.summary;
  const nodes = architecture?.nodes || EMPTY_ARR;
  const hotspots = architecture?.hotspots || EMPTY_ARR;
  const onboarding = architecture?.onboarding || EMPTY_ARR;
  const hs = summary?.healthScore ?? 0;

  const topHotspots = useMemo(() =>
    [...hotspots].sort((a, b) => (b.complexity || 0) - (a.complexity || 0)).slice(0, 5),
    [hotspots]
  );

  const langBreakdown = useMemo(() => {
    const counts = {};
    nodes.forEach((n) => {
      const ext = n.extension || '.js';
      counts[ext] = (counts[ext] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [nodes]);

  if (!result) return null;

  const healthLabel = hs >= 80 ? 'Excellent' : hs >= 60 ? 'Good' : hs >= 40 ? 'Fair' : 'Critical';
  const healthColor = hs >= 80 ? '#047857' : hs >= 60 ? '#b45309' : hs >= 40 ? '#b45309' : '#b91c1c';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      {/* Repo header */}
      <div className="fade-in" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="section-eyebrow">Repository</div>
          <h1 className="section-title">{repository?.fullName || repository?.name}</h1>
          {repository?.description && (
            <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', marginTop: 6, maxWidth: 560 }}>
              {repository.description}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setView('dependency')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            View Graph
          </button>
          <button className="btn btn-secondary" onClick={() => setView('health')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Health Report
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard label="Source Files"       value={summary?.totalFiles?.toLocaleString()}    sub="Analyzed files" />
        <StatCard label="Dependencies"       value={summary?.totalEdges?.toLocaleString()}    sub="Import edges" />
        <StatCard label="Symbols"            value={summary?.totalSymbols?.toLocaleString()}  sub="Functions / Classes" />
        <StatCard label="Circular Cycles"    value={summary?.circularCyclesCount}            sub="Dependency loops"
          color={summary?.circularCyclesCount > 0 ? 'var(--color-coral)' : 'var(--color-emerald)'} />
        <StatCard label="God Files"          value={summary?.godFilesCount}                  sub="High coupling nodes"
          color={summary?.godFilesCount > 0 ? 'var(--color-amber)' : 'var(--color-emerald)'} />
        <StatCard label="Parse Errors"       value={summary?.totalErrors}                    sub="Files skipped"
          color={summary?.totalErrors > 0 ? 'var(--color-amber)' : ''} />
      </div>

      {/* 3-column lower section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 20, alignItems: 'start', flexWrap: 'wrap' }}>
        {/* Health ring */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--color-outline)', textTransform: 'uppercase' }}>
            Health Score
          </div>
          <HealthRing score={hs} />
          <div style={{
            fontSize: 16, fontWeight: 700, color: healthColor,
            padding: '4px 14px', borderRadius: 'var(--radius-full)',
            background: `${healthColor}18`,
          }}>
            {healthLabel}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', textAlign: 'center', lineHeight: 1.5 }}>
            Based on complexity, coupling, and cycle density
          </div>
        </div>

        {/* Language breakdown */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 16, color: 'var(--color-on-surface)' }}>
            File Extensions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {langBreakdown.map(([ext, cnt]) => (
              <MetricRow key={ext} label={ext} value={cnt} max={nodes.length || 1} />
            ))}
          </div>
        </div>

        {/* Hotspots */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 16, color: 'var(--color-on-surface)' }}>
            Top Complexity Hotspots
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topHotspots.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--color-outline)', textAlign: 'center', padding: 16 }}>No hotspots detected</div>
            ) : topHotspots.map((h, i) => (
              <div key={h.id || i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                borderRadius: 'var(--radius)', background: 'var(--color-surface-container-low)',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i === 0 ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                  fontSize: 10, fontWeight: 700,
                  color: i === 0 ? 'var(--color-coral)' : 'var(--color-amber)',
                  flexShrink: 0,
                }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {h.name || h.id}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)' }}>
                    complexity {h.complexity}
                  </div>
                </div>
                <span className={`pill ${h.complexity > 10 ? 'pill-error' : 'pill-warn'}`}>
                  CC {h.complexity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Onboarding path */}
      {onboarding.length > 0 && (
        <div className="card fade-in">
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>🚀 Suggested Onboarding Path</div>
          <div style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', marginBottom: 16 }}>
            Start with low-complexity, low-coupling files to understand the codebase
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {onboarding.slice(0, 8).map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 'var(--radius-full)',
                background: 'var(--color-surface-container-low)',
                border: '1px solid var(--color-outline-variant)', fontSize: 12,
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: '50%', background: 'var(--color-primary)',
                  color: '#fff', fontSize: 9, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{i + 1}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
