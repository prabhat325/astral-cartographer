import React, { useMemo } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import { 
  Network, 
  Activity, 
  FileCode, 
  GitFork, 
  Layers, 
  AlertTriangle, 
  Flame, 
  Compass, 
  ShieldCheck, 
  Sparkles, 
  BookOpen, 
  Code
} from 'lucide-react';

/* ── Royal Health Ring ── */
function HealthRing({ score }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(100, score)) / 100 * circumference;
  
  const strokeColor = score >= 80 ? '#228B58' : score >= 50 ? '#D4AF70' : '#B93855';
  const trackColor = 'rgba(212, 175, 112, 0.2)';

  return (
    <svg width="150" height="150" viewBox="0 0 150 150">
      <defs>
        <radialGradient id="ringGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF9F5" />
          <stop offset="100%" stopColor="#F8F1E8" />
        </radialGradient>
      </defs>
      <circle cx="75" cy="75" r="66" fill="url(#ringGlow)" stroke="rgba(212, 175, 112, 0.25)" strokeWidth="1" />
      <circle cx="75" cy="75" r={r} fill="none" stroke={trackColor} strokeWidth="10" />
      <circle
        cx="75"
        cy="75"
        r={r}
        fill="none"
        stroke={strokeColor}
        strokeWidth="10"
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeLinecap="round"
        style={{
          transform: 'rotate(-90deg)',
          transformOrigin: '75px 75px',
          transition: 'stroke-dasharray 0.9s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      />
      <text
        x="75"
        y="70"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 32,
          fontWeight: 800,
          fill: 'var(--color-deep-burgundy)'
        }}
      >
        {score}
      </text>
      <text
        x="75"
        y="94"
        textAnchor="middle"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.05em',
          fill: 'var(--text-muted)'
        }}
      >
        OUT OF 100
      </text>
    </svg>
  );
}

function StatCard({ label, value, sub, icon: Icon, color, isWarning, onClick }) {
  return (
    <div
      className="stat-card fade-in"
      onClick={onClick}
      style={{
        borderColor: isWarning ? 'rgba(185, 56, 85, 0.4)' : undefined,
        background: isWarning ? 'linear-gradient(145deg, #FFFDFB 0%, #FDF2F4 100%)' : undefined,
        cursor: onClick ? 'pointer' : 'default'
      }}
      title={onClick ? `Open ${label}` : undefined}
    >
      <div className="stat-label">
        <span>{label}</span>
        {Icon && <Icon size={14} color={color || 'var(--color-antique-gold)'} />}
      </div>
      <div className="stat-value" style={color ? { color } : {}}>
        {value}
      </div>
      {sub && <div className="stat-meta">{sub}</div>}
    </div>
  );
}

function MetricRow({ label, value, max = 100, color = 'var(--grad-gold)' }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
        <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-deep-burgundy)' }}>{value}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const { state, setView, navigateToCodeExplorer } = useAnalysis();
  const { result } = state;

  const repository = result?.repository;
  const architecture = result?.architecture;
  const summary = architecture?.summary;
  const nodes = architecture?.nodes || [];
  const hotspots = architecture?.hotspots || [];
  const onboarding = architecture?.onboarding || {};
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

  const healthLabel = hs >= 80 ? 'Imperial Grade' : hs >= 60 ? 'Robust Structure' : hs >= 40 ? 'Moderate Debt' : 'Critical Action Needed';
  const healthColor = hs >= 80 ? '#228B58' : hs >= 60 ? '#A98245' : '#B93855';

  const goodFirstIssues = onboarding?.goodFirstIssues || [];
  const coreHubs = onboarding?.coreHubs || [];

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
      {/* Repository Title Banner */}
      <div className="royal-card fade-in" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20,
        background: 'linear-gradient(135deg, #FFFDFB 0%, #F9F1E8 100%)',
        border: '1.5px solid var(--border-gold-solid)'
      }}>
        <div>
          <div className="section-eyebrow">
            <Sparkles size={12} color="var(--color-antique-gold)" />
            <span>Repository Architecture Overview</span>
          </div>
          <h1 className="section-title">
            {repository?.fullName || repository?.name || 'Analyzed Codebase'}
          </h1>
          {repository?.description && (
            <p style={{
              fontSize: 14.5,
              color: 'var(--text-secondary)',
              marginTop: 6,
              maxWidth: 680,
              lineHeight: 1.6
            }}>
              {repository.description}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-gold" onClick={() => setView('dependency')}>
            <Network size={16} />
            <span>Open Dependency Graph</span>
          </button>
          <button className="btn btn-royal" onClick={() => setView('health')}>
            <Activity size={16} />
            <span>Full Health Audit</span>
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid (Clickable to jump directly into specific views) */}
      <div className="stats-grid">
        <StatCard
          label="Source Files"
          value={summary?.totalFiles?.toLocaleString() ?? 0}
          sub="Click to explore files"
          icon={FileCode}
          onClick={() => setView('codeExplorer')}
        />
        <StatCard
          label="Import Edges"
          value={summary?.totalEdges?.toLocaleString() ?? 0}
          sub="Click to open graph"
          icon={GitFork}
          onClick={() => setView('dependency')}
        />
        <StatCard
          label="AST Symbols"
          value={summary?.totalSymbols?.toLocaleString() ?? 0}
          sub="Functions & classes"
          icon={Code}
          onClick={() => setView('codeExplorer')}
        />
        <StatCard
          label="Circular Loops"
          value={summary?.circularCyclesCount ?? 0}
          sub={summary?.circularCyclesCount > 0 ? "Requires decoupling (click)" : "Clean hierarchy"}
          icon={AlertTriangle}
          color={summary?.circularCyclesCount > 0 ? 'var(--status-rose)' : 'var(--status-emerald)'}
          isWarning={summary?.circularCyclesCount > 0}
          onClick={() => setView('circular')}
        />
        <StatCard
          label="Debt Hotspots"
          value={summary?.godFilesCount ?? 0}
          sub="Click to view hotspots"
          icon={Flame}
          color={summary?.godFilesCount > 0 ? 'var(--status-amber)' : 'var(--status-emerald)'}
          onClick={() => setView('hotspots')}
        />
        <StatCard
          label="Function Calls"
          value={summary?.totalFunctionCalls?.toLocaleString() ?? 0}
          sub="Click for call graph"
          icon={Layers}
          onClick={() => setView('callGraph')}
        />
      </div>

      {/* 3-Column Visual Diagnostics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 320px) 1fr 1fr',
        gap: 20,
        alignItems: 'stretch'
      }}>
        {/* Health Ring Gauge */}
        <div
          className="royal-card fade-in"
          onClick={() => setView('health')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            padding: 28,
            cursor: 'pointer'
          }}
          title="Click to view Architecture Health Breakdown"
        >
          <div style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase'
          }}>
            Imperial Health Score
          </div>
          <HealthRing score={hs} />
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            color: healthColor,
            padding: '5px 16px',
            borderRadius: 'var(--radius-full)',
            background: `${healthColor}16`,
            border: `1px solid ${healthColor}40`,
            fontFamily: 'var(--font-sans)'
          }}>
            {healthLabel}
          </div>
          <div style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            textAlign: 'center',
            lineHeight: 1.5,
            maxWidth: 240
          }}>
            Weighted synthesis of cyclomatic debt, coupling topology, and recursion loops.
          </div>
        </div>

        {/* File Extension Distribution */}
        <div className="royal-card fade-in">
          <div style={{
            fontWeight: 700,
            fontSize: 15,
            marginBottom: 16,
            color: 'var(--color-deep-burgundy)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>File Types & Extensions</span>
            <span className="pill pill-gold">{langBreakdown.length} types</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {langBreakdown.map(([ext, cnt]) => (
              <MetricRow
                key={ext}
                label={ext}
                value={`${cnt} file${cnt > 1 ? 's' : ''}`}
                max={nodes.length || 1}
              />
            ))}
          </div>
        </div>

        {/* Complexity Hotspots Preview */}
        <div className="royal-card fade-in">
          <div style={{
            fontWeight: 700,
            fontSize: 15,
            marginBottom: 16,
            color: 'var(--color-deep-burgundy)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Top Complexity Hotspots</span>
            <button
              type="button"
              className="btn-ghost"
              style={{ fontSize: 11, padding: '2px 8px' }}
              onClick={() => setView('hotspots')}
            >
              View All ({hotspots.length || nodes.length}) →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topHotspots.length === 0 ? (
              <div style={{
                fontSize: 13,
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: '30px 10px'
              }}>
                No high-complexity hotspots detected. Excellent modular cohesion.
              </div>
            ) : topHotspots.map((h, i) => (
              <div
                key={h.file || h.id || i}
                onClick={() => navigateToCodeExplorer(h.file || h.name || h.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-warm-ivory)',
                  border: '1px solid var(--border-gold-subtle)',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease'
                }}
                title="Click to inspect this file in Code Explorer"
              >
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: i === 0 ? 'rgba(185, 56, 85, 0.15)' : 'rgba(212, 175, 112, 0.25)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: i === 0 ? 'var(--status-rose)' : 'var(--color-antique-gold)',
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'var(--color-deep-burgundy)'
                  }}>
                    {h.file || h.name || h.id}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {h.loc ? `${h.loc} lines · ` : ''}Cyclomatic CC: {h.complexity}
                  </div>
                </div>
                <span className={`pill ${h.complexity > 10 ? 'pill-error' : 'pill-amber'}`}>
                  CC {h.complexity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Smart Onboarding Recommendations Preview */}
      {(goodFirstIssues.length > 0 || coreHubs.length > 0) && (
        <div className="royal-card royal-card-highlight fade-in" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Compass size={20} color="var(--color-antique-gold)" />
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--color-deep-burgundy)'
              }}>
                Smart Onboarding Pathways & Architecture Tour
              </h3>
            </div>
            <button
              type="button"
              className="btn btn-royal"
              style={{ fontSize: 12, padding: '6px 14px' }}
              onClick={() => setView('onboarding')}
            >
              Explore Full Pathways →
            </button>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Automated architectural recommendations to guide developers navigating this codebase for the first time.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
            {/* Good First Issues */}
            {goodFirstIssues.length > 0 && (
              <div style={{
                background: 'var(--color-pearl-white)',
                border: '1px solid var(--border-gold-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '18px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--color-antique-gold)',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: 12
                }}>
                  <ShieldCheck size={16} />
                  <span>SAFE ENTRY MODULES (LOW BLAST RADIUS)</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {goodFirstIssues.slice(0, 5).map((f, i) => (
                    <div
                      key={i}
                      onClick={() => navigateToCodeExplorer(f.file || f.name)}
                      style={{
                        padding: '10px 12px',
                        background: 'var(--color-warm-ivory)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(212, 175, 112, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        cursor: 'pointer'
                      }}
                      title="Click to view file in Code Explorer"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--color-deep-burgundy)'
                        }}>
                          {f.file || f.name}
                        </span>
                        <span className="pill pill-emerald" style={{ height: 18, fontSize: 10 }}>
                          CC {f.complexity ?? 1} · {f.loc ?? 0} LOC
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                        {f.recommendation || 'Safe isolated file for newcomer contributions.'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Core Architectural Hubs */}
            {coreHubs.length > 0 && (
              <div style={{
                background: 'var(--color-pearl-white)',
                border: '1px solid var(--border-gold-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '18px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--color-deep-burgundy)',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: 12
                }}>
                  <BookOpen size={16} color="var(--color-champagne-gold)" />
                  <span>CORE ARCHITECTURAL HUBS (READ FIRST)</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {coreHubs.slice(0, 5).map((h, i) => (
                    <div
                      key={i}
                      onClick={() => navigateToCodeExplorer(h.file || h.name)}
                      style={{
                        padding: '10px 12px',
                        background: 'var(--color-warm-ivory)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(212, 175, 112, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        cursor: 'pointer'
                      }}
                      title="Click to view file in Code Explorer"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--color-deep-burgundy)'
                        }}>
                          {h.file || h.name}
                        </span>
                        <span className="pill pill-gold" style={{ height: 18, fontSize: 10 }}>
                          {h.dependentsCount ?? 0} Dependents
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                        {h.recommendation || 'Fundamental hub defining core data flow.'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
