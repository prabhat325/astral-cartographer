import React, { useState } from 'react';
import { useAnalysis } from '../context/AnalysisContext';

function CycleCard({ cycle, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card fade-in" style={{ padding: 0, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
          background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(239,68,68,0.12)', color: 'var(--color-coral)',
          fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{index + 1}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {Array.isArray(cycle) ? cycle[0] : cycle?.nodes?.[0] || 'Cycle'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', marginTop: 2 }}>
            Depth: {Array.isArray(cycle) ? cycle.length : cycle?.nodes?.length ?? '?'} files
          </div>
        </div>
        <span className="pill pill-error">Circular</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ transform: open ? 'rotate(180deg)' : '', transition: 'transform 0.2s', flexShrink: 0, opacity: 0.5 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--color-outline-variant)' }}>
          <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {(Array.isArray(cycle) ? cycle : cycle?.nodes || []).map((node, i, arr) => (
              <React.Fragment key={i}>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, padding: '4px 10px',
                  background: 'var(--color-surface-container-low)', borderRadius: 4,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{node}</div>
                {i < arr.length - 1 && (
                  <div style={{ fontSize: 11, color: 'var(--color-coral)', padding: '0 10px', fontFamily: 'var(--font-mono)' }}>↓ imports</div>
                )}
              </React.Fragment>
            ))}
            {/* Loop indicator */}
            <div style={{ fontSize: 11, color: 'var(--color-coral)', padding: '0 10px', fontFamily: 'var(--font-mono)' }}>
              ↩ loops back to start
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HotspotBar({ node }) {
  const maxCC = 50;
  const pct = Math.min(((node.complexity || 1) / maxCC) * 100, 100);
  const color = node.complexity > 15 ? 'var(--color-coral)' : node.complexity > 8 ? 'var(--color-amber)' : 'var(--color-emerald)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 0', borderBottom: '1px solid var(--color-outline-variant)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {node.name || node.id}
        </span>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <span className="pill" style={{ background: `${color}18`, color, height: 20, fontSize: 10 }}>CC {node.complexity}</span>
          <span className="pill pill-neutral" style={{ height: 20, fontSize: 10 }}>in:{node.inDegree} out:{node.outDegree}</span>
        </div>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function ScoreGauge({ label, value, max = 100, inverse = false }) {
  const pct = Math.min((value / max) * 100, 100);
  const good = inverse ? pct < 30 : pct > 70;
  const bad  = inverse ? pct > 60 : pct < 30;
  const color = good ? 'var(--color-emerald)' : bad ? 'var(--color-coral)' : 'var(--color-amber)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: 'var(--color-on-surface-variant)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color }}>{value}{max !== 100 ? '' : '%'}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function HealthPage() {
  const { state } = useAnalysis();
  const { result } = state;
  if (!result) return null;

  const arch = result.architecture;
  const { summary, circularCycles = [], hotspots = [], nodes = [], errors = [] } = arch;
  const hs = summary?.healthScore ?? 0;

  const godFiles   = nodes.filter(n => n.isGodFile);
  const orphans    = nodes.filter(n => n.inDegree === 0 && n.outDegree === 0);
  const highCC     = nodes.filter(n => (n.complexity || 0) > 10);
  const sortedHots = [...(hotspots || nodes)].sort((a,b)=>(b.complexity||0)-(a.complexity||0)).slice(0,15);

  const avgCC = nodes.length
    ? Math.round(nodes.reduce((s,n) => s + (n.complexity||1), 0) / nodes.length)
    : 0;

  const healthLabel = hs >= 80 ? 'Excellent' : hs >= 60 ? 'Good' : hs >= 40 ? 'Fair' : 'Critical';
  const healthColor = hs >= 80 ? '#047857' : hs >= 60 ? '#b45309' : '#b91c1c';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div className="fade-in">
        <div className="section-eyebrow">Architecture Health</div>
        <h1 className="section-title">Code Quality Report</h1>
        <p className="section-subtitle" style={{ marginTop: 6 }}>
          {result.repository?.fullName} · {nodes.length} files analyzed
        </p>
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 16 }}>
        {[
          { label: 'Health Score',    value: `${hs}/100`, color: healthColor, sub: healthLabel },
          { label: 'Circular Cycles', value: circularCycles.length, color: circularCycles.length ? 'var(--color-coral)' : 'var(--color-emerald)', sub: circularCycles.length ? 'Needs fixing' : 'Clean' },
          { label: 'God Files',       value: godFiles.length,   color: godFiles.length ? 'var(--color-amber)' : 'var(--color-emerald)', sub: godFiles.length ? 'High coupling' : 'None detected' },
          { label: 'Orphan Files',    value: orphans.length,    color: orphans.length ? 'var(--color-amber)' : 'var(--color-emerald)', sub: orphans.length ? 'Unreachable' : 'None' },
          { label: 'High CC Files',   value: highCC.length,     color: highCC.length ? 'var(--color-amber)' : 'var(--color-emerald)', sub: 'CC > 10' },
          { label: 'Avg Complexity',  value: avgCC, color: avgCC > 8 ? 'var(--color-amber)' : 'var(--color-emerald)', sub: 'Cyclomatic' },
        ].map(c => (
          <div key={c.label} className="stat-card fade-in">
            <div className="stat-label">{c.label}</div>
            <div className="stat-value" style={{ fontSize: 24, color: c.color }}>{c.value}</div>
            <div className="stat-meta">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Gauge scores */}
      <div className="card fade-in">
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 16 }}>Health Breakdown</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
          <ScoreGauge label="Architecture Health"  value={hs} />
          <ScoreGauge label="Circular Risk"        value={Math.min(circularCycles.length * 10, 100)} max={100} inverse />
          <ScoreGauge label="Coupling Risk"        value={Math.min(godFiles.length * 20, 100)} max={100} inverse />
          <ScoreGauge label="Complexity Risk"      value={Math.min(avgCC * 8, 100)} max={100} inverse />
        </div>
      </div>

      {/* Two-column: cycles + hotspots */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Circular cycles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🔴 Circular Dependencies</span>
            <span className="pill pill-error">{circularCycles.length}</span>
          </div>
          {circularCycles.length === 0 ? (
            <div className="alert alert-success">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              No circular dependencies detected. Your codebase has clean import topology.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {circularCycles.map((c, i) => <CycleCard key={i} cycle={c} index={i} />)}
            </div>
          )}
        </div>

        {/* Complexity hotspots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚡ Complexity Hotspots</span>
            <span className="pill pill-warn">{sortedHots.length}</span>
          </div>
          <div className="card" style={{ padding: '12px 16px' }}>
            {sortedHots.length === 0
              ? <div className="empty-state" style={{ padding: 20 }}><div className="empty-state-text">No complexity hotspots</div></div>
              : sortedHots.map((n, i) => <HotspotBar key={n.id || i} node={n} />)
            }
          </div>
        </div>
      </div>

      {/* God files */}
      {godFiles.length > 0 && (
        <div className="card fade-in">
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>⚠️ God Files (High Afferent Coupling)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
            {godFiles.map(n => (
              <div key={n.id} style={{
                padding: '10px 12px', borderRadius: 'var(--radius)',
                background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {n.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', marginTop: 3 }}>
                  in:{n.inDegree} · out:{n.outDegree} · CC:{n.complexity}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="card fade-in">
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>🔧 Parse Errors ({errors.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {errors.slice(0, 10).map((e, i) => (
              <div key={i} className="alert alert-warn" style={{ fontSize: 12 }}>
                <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, flex: 1 }}>{e.file}</code>
                <span style={{ opacity: 0.7 }}>{e.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
