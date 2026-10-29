import React, { useState } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import { 
  Activity, 
  AlertTriangle, 
  Flame, 
  CheckCircle2, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';

/* ── Interactive Cycle Card ── */
function CycleCard({ cycle, index }) {
  const [open, setOpen] = useState(true);
  const cycleNodes = Array.isArray(cycle) ? cycle : cycle?.nodes || [];

  return (
    <div className="royal-card fade-in" style={{ padding: 0, overflow: 'hidden', border: '1.5px solid rgba(185, 56, 85, 0.35)' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: 'linear-gradient(135deg, #FFFDFB 0%, #FAF0F2 100%)',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          flexShrink: 0,
          background: 'rgba(185, 56, 85, 0.12)',
          color: 'var(--status-rose)',
          fontSize: 13,
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)'
        }}>
          #{index + 1}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--color-deep-burgundy)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {cycleNodes[0] || 'Circular Loop Vector'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Chain depth: {cycleNodes.length} modular hops · Recursive deadlock hazard
          </div>
        </div>

        <span className="pill pill-error">
          Circular Dependency
        </span>

        {open ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
      </button>

      {open && (
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border-gold-subtle)',
          background: 'var(--color-pearl-white)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {cycleNodes.map((node, i, arr) => (
              <React.Fragment key={i}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  padding: '7px 12px',
                  background: 'var(--color-warm-ivory)',
                  border: '1px solid var(--border-gold-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--color-deep-burgundy)',
                  fontWeight: 600
                }}>
                  <span style={{ color: 'var(--color-antique-gold)', fontSize: 11 }}>[{i + 1}]</span>
                  <span>{node}</span>
                </div>
                {i < arr.length - 1 && (
                  <div style={{
                    fontSize: 11.5,
                    color: 'var(--status-rose)',
                    padding: '0 18px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span>↓ imports</span>
                  </div>
                )}
              </React.Fragment>
            ))}
            <div style={{
              fontSize: 11.5,
              color: 'var(--status-rose)',
              padding: '4px 18px 0',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span>↩ Recursively cycles back to: {cycleNodes[0]}</span>
            </div>
          </div>

          <div style={{
            marginTop: 14,
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(212, 175, 112, 0.12)',
            border: '1px solid rgba(212, 175, 112, 0.3)',
            fontSize: 12,
            color: 'var(--color-deep-burgundy)',
            lineHeight: 1.5
          }}>
            <strong>Remediation Strategy:</strong> Extract shared interfaces or utilities into an independent module, or implement dependency inversion via parameter injection.
          </div>
        </div>
      )}
    </div>
  );
}

function HotspotBar({ node }) {
  const maxCC = 40;
  const pct = Math.min(((node.complexity || 1) / maxCC) * 100, 100);
  const color = node.complexity > 12 ? 'var(--status-rose)' : node.complexity > 6 ? 'var(--color-antique-gold)' : 'var(--status-emerald)';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      padding: '12px 0',
      borderBottom: '1px solid var(--border-gold-subtle)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12.5,
          fontWeight: 600,
          color: 'var(--color-deep-burgundy)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1
        }}>
          {node.name || node.id || node.file}
        </span>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <span className="pill" style={{ background: `${color}18`, color, height: 20, fontSize: 10 }}>
            CC {node.complexity}
          </span>
          <span className="pill pill-gold" style={{ height: 20, fontSize: 10 }}>
            In:{node.inDegree ?? 0} · Out:{node.outDegree ?? 0}
          </span>
        </div>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      {node.reason && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {node.reason}
        </div>
      )}
    </div>
  );
}

function ScoreGauge({ label, value, max = 100, inverse = false }) {
  const pct = Math.min((value / max) * 100, 100);
  const good = inverse ? pct < 30 : pct > 70;
  const bad = inverse ? pct > 60 : pct < 30;
  const color = good ? 'var(--status-emerald)' : bad ? 'var(--status-rose)' : 'var(--color-antique-gold)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color }}>
          {value}{max === 100 ? '%' : ''}
        </span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function HealthPage() {
  const { state, setView, navigateToCodeExplorer } = useAnalysis();
  const { result } = state;
  if (!result) return null;

  const arch = result.architecture;
  const {
    summary,
    circularCycles = [],
    hotspots = [],
    nodes = [],
    errors = []
  } = arch;

  const hs = summary?.healthScore ?? 0;
  const godFiles = nodes.filter(n => n.isGodFile);
  const orphans = nodes.filter(n => (n.inDegree || 0) === 0 && (n.outDegree || 0) === 0);
  const highCC = nodes.filter(n => (n.complexity || 0) > 10);
  const sortedHots = [...(hotspots.length > 0 ? hotspots : nodes)]
    .sort((a, b) => (b.complexity || 0) - (a.complexity || 0))
    .slice(0, 12);

  const avgCC = nodes.length
    ? Math.round(nodes.reduce((s, n) => s + (n.complexity || 1), 0) / nodes.length)
    : 1;

  const healthLabel = hs >= 80 ? 'Imperial Grade' : hs >= 60 ? 'Robust Structure' : hs >= 40 ? 'Moderate Debt' : 'Critical Action Needed';
  const healthColor = hs >= 80 ? '#228B58' : hs >= 60 ? '#A98245' : '#B93855';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 28,
      maxWidth: 1200,
      margin: '0 auto',
      width: '100%',
      padding: '28px 0'
    }}>
      {/* Page Header */}
      <div className="royal-card fade-in" style={{
        background: 'linear-gradient(135deg, #FFFDFB 0%, #FAF1E8 100%)',
        border: '1.5px solid var(--border-gold-solid)'
      }}>
        <div className="section-eyebrow">
          <Activity size={12} color="var(--color-antique-gold)" />
          <span>Code Quality & Architectural Risk Audit</span>
        </div>
        <h1 className="section-title">Imperial Health Assessment</h1>
        <p className="section-subtitle" style={{ marginTop: 6 }}>
          {result.repository?.fullName} · {nodes.length} files synthesized across AST dependency vectors.
        </p>
      </div>

      {/* Summary Scorecard Grid */}
      <div className="stats-grid">
        <div className="stat-card fade-in" style={{ border: `1.5px solid ${healthColor}` }}>
          <div className="stat-label">
            <span>Health Rating</span>
            <Sparkles size={14} color={healthColor} />
          </div>
          <div className="stat-value" style={{ color: healthColor }}>
            {hs}/100
          </div>
          <div className="stat-meta" style={{ fontWeight: 600 }}>{healthLabel}</div>
        </div>

        <div className="stat-card fade-in" style={{
          borderColor: circularCycles.length ? 'rgba(185, 56, 85, 0.4)' : undefined
        }}>
          <div className="stat-label">
            <span>Circular Cycles</span>
            <AlertTriangle size={14} color={circularCycles.length ? 'var(--status-rose)' : 'var(--status-emerald)'} />
          </div>
          <div className="stat-value" style={{ color: circularCycles.length ? 'var(--status-rose)' : 'var(--status-emerald)' }}>
            {circularCycles.length}
          </div>
          <div className="stat-meta">{circularCycles.length ? 'Requires decoupling' : 'Clean hierarchy'}</div>
        </div>

        <div className="stat-card fade-in">
          <div className="stat-label">
            <span>God Files</span>
            <Flame size={14} color={godFiles.length ? 'var(--color-antique-gold)' : 'var(--status-emerald)'} />
          </div>
          <div className="stat-value" style={{ color: godFiles.length ? 'var(--color-antique-gold)' : 'var(--status-emerald)' }}>
            {godFiles.length}
          </div>
          <div className="stat-meta">{godFiles.length ? 'Elevated coupling' : 'Well partitioned'}</div>
        </div>

        <div className="stat-card fade-in">
          <div className="stat-label">
            <span>Orphan Files</span>
            <HelpCircle size={14} color="var(--text-muted)" />
          </div>
          <div className="stat-value">
            {orphans.length}
          </div>
          <div className="stat-meta">Isolated modules</div>
        </div>

        <div className="stat-card fade-in">
          <div className="stat-label">
            <span>High CC Files</span>
            <ShieldAlert size={14} color={highCC.length ? 'var(--status-amber)' : 'var(--status-emerald)'} />
          </div>
          <div className="stat-value" style={{ color: highCC.length ? 'var(--status-amber)' : 'var(--status-emerald)' }}>
            {highCC.length}
          </div>
          <div className="stat-meta">Complexity &gt; 10</div>
        </div>

        <div className="stat-card fade-in">
          <div className="stat-label">
            <span>Avg Complexity</span>
            <Activity size={14} color="var(--color-antique-gold)" />
          </div>
          <div className="stat-value">
            {avgCC}
          </div>
          <div className="stat-meta">Cyclomatic Index</div>
        </div>
      </div>

      {/* Four Core Risk Gauges */}
      <div className="royal-card fade-in">
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--color-deep-burgundy)',
          marginBottom: 18
        }}>
          Risk Factor Decomposition
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          <ScoreGauge label="Architecture Health" value={hs} />
          <ScoreGauge label="Circular Recursion Risk" value={Math.min(circularCycles.length * 15, 100)} max={100} inverse />
          <ScoreGauge label="God File Coupling Risk" value={Math.min(godFiles.length * 25, 100)} max={100} inverse />
          <ScoreGauge label="Cyclomatic Complexity Debt" value={Math.min(avgCC * 10, 100)} max={100} inverse />
        </div>
      </div>

      {/* Two-Column: Cycles & Hotspots */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Circular Cycles Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--color-deep-burgundy)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <AlertTriangle size={18} color="var(--status-rose)" />
              <span>Circular Dependencies</span>
            </div>
            <button
              type="button"
              className="btn btn-royal"
              style={{ fontSize: 12, padding: '4px 10px' }}
              onClick={() => setView('circular')}
            >
              Full Cycle Audit →
            </button>
          </div>

          {circularCycles.length === 0 ? (
            <div className="alert alert-success">
              <CheckCircle2 size={18} color="var(--status-emerald)" style={{ flexShrink: 0 }} />
              <div>
                <strong>Zero Circular Dependencies Detected:</strong> Your codebase maintains a clean directional acyclic graph (DAG), preventing recursive import initialization issues.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {circularCycles.slice(0, 4).map((c, i) => (
                <CycleCard key={i} cycle={c} index={i} />
              ))}
              {circularCycles.length > 4 && (
                <button
                  type="button"
                  className="btn btn-gold"
                  style={{ width: '100%', fontSize: 12.5 }}
                  onClick={() => setView('circular')}
                >
                  View All {circularCycles.length} Circular Cycles →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Complexity Hotspots Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--color-deep-burgundy)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <Flame size={18} color="var(--color-antique-gold)" />
              <span>Complexity Hotspots</span>
            </div>
            <button
              type="button"
              className="btn btn-royal"
              style={{ fontSize: 12, padding: '4px 10px' }}
              onClick={() => setView('hotspots')}
            >
              View All Hotspots →
            </button>
          </div>

          <div className="royal-card" style={{ padding: '16px 20px' }}>
            {sortedHots.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                No technical debt hotspots detected.
              </div>
            ) : (
              sortedHots.slice(0, 8).map((n, i) => (
                <div
                  key={n.id || n.file || i}
                  onClick={() => navigateToCodeExplorer(n.file || n.id || n.name)}
                  style={{ cursor: 'pointer' }}
                  title="Click to inspect in Code Explorer"
                >
                  <HotspotBar node={n} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* God Files Detailed Section */}
      {godFiles.length > 0 && (
        <div className="royal-card fade-in" style={{
          border: '1.5px solid var(--border-gold-solid)',
          background: 'linear-gradient(135deg, #FFFDFB 0%, #FDF3E7 100%)'
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--color-deep-burgundy)',
            marginBottom: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Flame size={18} color="var(--color-antique-gold)" />
            <span>High Afferent Coupling: God Files ({godFiles.length})</span>
          </div>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 16 }}>
            These modules have an unusually high number of dependents combined with large LOC and complexity, creating high blast radius risks if refactored.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {godFiles.map(n => (
              <div
                key={n.id}
                onClick={() => navigateToCodeExplorer(n.id)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-pearl-white)',
                  border: '1px solid var(--border-gold-solid)',
                  boxShadow: '0 2px 8px rgba(212, 175, 112, 0.15)',
                  cursor: 'pointer'
                }}
                title="Click to inspect god file in Code Explorer"
              >
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: 'var(--color-deep-burgundy)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {n.name}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Inward: {n.inDegree} · Outward: {n.outDegree} · CC: {n.complexity}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parse Errors section if any */}
      {errors.length > 0 && (
        <div className="royal-card fade-in">
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--color-deep-burgundy)',
            marginBottom: 12
          }}>
            AST Parsing Diagnostics ({errors.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {errors.slice(0, 10).map((e, i) => (
              <div key={i} className="alert alert-error" style={{ fontSize: 12.5 }}>
                <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, flex: 1 }}>{e.file}</code>
                <span style={{ opacity: 0.85 }}>{e.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
