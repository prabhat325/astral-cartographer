import React, { useMemo, useState } from 'react';
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

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="stat-card fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="stat-label">{label}</div>
        {icon && <span style={{ fontSize: 14, opacity: 0.7 }}>{icon}</span>}
      </div>
      <div className="stat-value" style={color ? { color } : {}}>{value}</div>
      {sub && <div className="stat-meta">{sub}</div>}
    </div>
  );
}

const EMPTY_ARR = [];

const EMPTY_OBJ = {};

export default function OverviewPage() {
  const { state, setView } = useAnalysis();
  const { result } = state;

  const [activeTab, setActiveTab] = useState('summary');

  const repository = result?.repository;
  const architecture = result?.architecture;
  const summary = architecture?.summary;
  const nodes = architecture?.nodes || EMPTY_ARR;
  const hotspots = architecture?.hotspots || EMPTY_ARR;
  const hs = summary?.healthScore ?? 0;

  const branches = repository?.branches || EMPTY_ARR;
  const commits = repository?.commits || EMPTY_ARR;
  const rawLanguages = repository?.languages || EMPTY_OBJ;

  // Compute total LOC across nodes
  const totalLoc = useMemo(() => {
    return nodes.reduce(
      (acc, n) => {
        acc.total += n.loc?.total || 0;
        acc.code += n.loc?.code || 0;
        acc.comment += n.loc?.comment || 0;
        return acc;
      },
      { total: 0, code: 0, comment: 0 }
    );
  }, [nodes]);

  // Max complexity
  const maxComplexity = useMemo(() => {
    return nodes.reduce((max, n) => Math.max(max, n.complexity || 1), 1);
  }, [nodes]);

  const topHotspots = useMemo(() =>
    [...hotspots].sort((a, b) => (b.complexity || 0) - (a.complexity || 0)).slice(0, 5),
    [hotspots]
  );

  // Language breakdown
  const languageList = useMemo(() => {
    if (Object.keys(rawLanguages).length > 0) {
      const totalBytes = Object.values(rawLanguages).reduce((a, b) => a + b, 0) || 1;
      return Object.entries(rawLanguages)
        .sort((a, b) => b[1] - a[1])
        .map(([lang, bytes]) => ({
          name: lang,
          pct: Math.round((bytes / totalBytes) * 100),
          bytes
        }));
    }
    // Fallback from nodes extensions
    const counts = {};
    nodes.forEach((n) => {
      const ext = n.extension || '.js';
      counts[ext] = (counts[ext] || 0) + 1;
    });
    const totalFiles = Math.max(1, nodes.length);
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([ext, count]) => ({
        name: ext,
        pct: Math.round((count / totalFiles) * 100),
        count
      }));
  }, [rawLanguages, nodes]);

  if (!result) return null;

  const healthLabel = hs >= 80 ? 'Excellent' : hs >= 60 ? 'Good' : hs >= 40 ? 'Fair' : 'Critical';
  const healthColor = hs >= 80 ? '#047857' : hs >= 60 ? '#b45309' : hs >= 40 ? '#b45309' : '#b91c1c';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100, margin: '0 auto', width: '100%', paddingBottom: 40 }}>

      {/* Repo header banner */}
      <div className="fade-in" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="section-eyebrow">GitHub Repository Overview</div>
          <h1 className="section-title">{repository?.fullName || repository?.name}</h1>
          {repository?.description && (
            <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', marginTop: 6, maxWidth: 640 }}>
              {repository.description}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {repository?.htmlUrl && (
            <a href={repository.htmlUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ fontSize: 12 }}>
              GitHub Repo ↗
            </a>
          )}
          <button className="btn btn-primary" onClick={() => setView('dependency')}>
            Interactive Graph ➔
          </button>
        </div>
      </div>

      {/* GitHub Repository Metadata Card */}
      <div className="card fade-in" style={{ padding: '16px 20px', background: 'var(--color-surface-container-low)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16 }}>
          <div>
            <div className="stat-label">Stars</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-on-surface)' }}>
              ⭐ {repository?.stars?.toLocaleString() ?? '—'}
            </div>
          </div>
          <div>
            <div className="stat-label">Forks</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-on-surface)' }}>
              🍴 {repository?.forks?.toLocaleString() ?? '—'}
            </div>
          </div>
          <div>
            <div className="stat-label">Watchers</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-on-surface)' }}>
              👁️ {repository?.watchers?.toLocaleString() ?? '—'}
            </div>
          </div>
          <div>
            <div className="stat-label">Open Issues</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-on-surface)' }}>
              ⚠️ {repository?.openIssues ?? '—'}
            </div>
          </div>
          <div>
            <div className="stat-label">Default Branch</div>
            <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
              🌿 {repository?.defaultBranch || 'main'}
            </div>
          </div>
          <div>
            <div className="stat-label">License</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-on-surface)' }}>
              ⚖️ {repository?.license || 'MIT'}
            </div>
          </div>
          <div>
            <div className="stat-label">Repo Size</div>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-on-surface)' }}>
              📦 {repository?.sizeKb ? `${repository.sizeKb} KB` : `${nodes.length} files`}
            </div>
          </div>
        </div>
      </div>

      {/* High-level metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
        <StatCard label="Total Files" value={summary?.totalFiles ?? nodes.length} sub="Source modules" icon="📁" />
        <StatCard label="Total Code LOC" value={totalLoc.code ? totalLoc.code.toLocaleString() : '—'} sub={`${totalLoc.total} total lines`} icon="📝" />
        <StatCard label="Classes & Structs" value={summary?.totalClasses ?? 0} sub="Extracted AST types" icon="🏛️" />
        <StatCard label="Functions & Methods" value={summary?.totalFunctions ?? summary?.totalSymbols ?? 0} sub="Callable components" icon="⚡" />
        <StatCard label="Dependencies / Edges" value={summary?.totalEdges ?? 0} sub={`${summary?.circularCyclesCount ?? 0} circular`} icon="🔗" />
        <StatCard label="Avg Complexity" value={summary?.avgComplexity ?? 1} sub={`Max: ${maxComplexity}`} icon="📊" />
      </div>

      {/* Main 2-column layout: Health score + Architecture Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>

        {/* Health card */}
        <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-on-surface)', alignSelf: 'flex-start' }}>
            Architecture Health Score
          </div>
          <HealthRing score={hs} />
          <div>
            <span className="pill" style={{ background: `${healthColor}18`, color: healthColor, fontWeight: 700, fontSize: 12 }}>
              {healthLabel} Health
            </span>
            <div style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', marginTop: 8 }}>
              {summary?.circularCyclesCount ? `⚠️ ${summary.circularCyclesCount} circular import loop(s) detected.` : '✅ Clean dependency acyclicity.'}
              {summary?.godFilesCount ? ` ${summary.godFilesCount} God file(s) require refactoring.` : ''}
            </div>
          </div>
          <div style={{ width: '100%', borderTop: '1px solid var(--color-outline-variant)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-on-surface-variant)' }}>Circular Cycles</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: summary?.circularCyclesCount ? 'var(--color-coral)' : 'var(--color-emerald)' }}>
                {summary?.circularCyclesCount ?? 0}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-on-surface-variant)' }}>God Files</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: summary?.godFilesCount ? 'var(--color-amber)' : 'var(--color-emerald)' }}>
                {summary?.godFilesCount ?? 0}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-on-surface-variant)' }}>AST Parse Errors</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{summary?.totalErrors ?? 0}</span>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ width: '100%', fontSize: 12 }} onClick={() => setView('health')}>
            View Full Health Breakdown ➔
          </button>
        </div>

        {/* Tabbed right section: Summary / Commits / Branches / Hotspots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Tab Selector */}
          <div className="tab-bar" style={{ display: 'flex' }}>
            <button className={`tab-item${activeTab === 'summary' ? ' active' : ''}`} onClick={() => setActiveTab('summary')}>
              Architectural Hotspots
            </button>
            <button className={`tab-item${activeTab === 'languages' ? ' active' : ''}`} onClick={() => setActiveTab('languages')}>
              Languages
            </button>
            <button className={`tab-item${activeTab === 'commits' ? ' active' : ''}`} onClick={() => setActiveTab('commits')}>
              Recent Commits ({commits.length})
            </button>
            <button className={`tab-item${activeTab === 'branches' ? ' active' : ''}`} onClick={() => setActiveTab('branches')}>
              Branches ({branches.length})
            </button>
          </div>

          {/* TAB: Architectural Hotspots */}
          {activeTab === 'summary' && (
            <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Top Complexity Hotspots</span>
                <span className="pill pill-warn">{hotspots.length} detected</span>
              </div>
              {topHotspots.length === 0 ? (
                <div className="alert alert-success">No high-risk hotspots found in this repository.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {topHotspots.map((h, i) => (
                    <div key={i} style={{
                      padding: '10px 14px', borderRadius: 'var(--radius)',
                      background: 'var(--color-surface-container-low)',
                      border: '1px solid var(--color-outline-variant)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {h.file}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', marginTop: 2 }}>
                          {h.reason || `Complexity ${h.complexity}, ${h.inDegree} dependents`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <span className={`pill ${h.riskLevel === 'critical' ? 'pill-error' : 'pill-warn'}`} style={{ fontSize: 10 }}>
                          CC {h.complexity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="btn btn-secondary" style={{ flex: 1, fontSize: 12 }} onClick={() => setView('onboarding')}>
                  Open Onboarding Pathfinder ➔
                </button>
                <button className="btn btn-primary" style={{ flex: 1, fontSize: 12 }} onClick={() => setView('dependency')}>
                  Inspect in Graph ➔
                </button>
              </div>
            </div>
          )}

          {/* TAB: Languages */}
          {activeTab === 'languages' && (
            <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Language Distribution</div>
              {/* Visual Multi-color Progress Bar */}
              <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', width: '100%' }}>
                {languageList.map((lang, idx) => {
                  const colors = ['#f59e0b', '#3b82f6', '#10b981', '#06b6d4', '#8b5cf6', '#ec4899'];
                  return (
                    <div key={lang.name} style={{ width: `${lang.pct}%`, background: colors[idx % colors.length] }} title={`${lang.name}: ${lang.pct}%`} />
                  );
                })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {languageList.map((lang) => (
                  <div key={lang.name} style={{ padding: '8px 12px', borderRadius: 'var(--radius)', background: 'var(--color-surface-container-low)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{lang.name}</span>
                    <span className="pill pill-neutral" style={{ fontSize: 11 }}>{lang.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: Recent Commits */}
          {activeTab === 'commits' && (
            <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Recent Commits (GitHub REST API)</span>
                <span className="pill pill-neutral">{commits.length} commits</span>
              </div>
              {commits.length === 0 ? (
                <div className="empty-state" style={{ padding: 20 }}>
                  <div className="empty-state-text">No commit logs retrieved for this repository.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
                  {commits.map((c, i) => (
                    <div key={i} style={{ padding: '8px 12px', borderRadius: 'var(--radius)', background: 'var(--color-surface-container-low)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-on-surface)' }}>{c.message}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', marginTop: 2 }}>
                          {c.author} {c.date ? `· ${new Date(c.date).toLocaleDateString()}` : ''}
                        </div>
                      </div>
                      <span className="pill pill-neutral" style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                        {c.sha}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: Branches */}
          {activeTab === 'branches' && (
            <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Branches (GitHub REST API)</span>
                <span className="pill pill-neutral">{branches.length} branches</span>
              </div>
              {branches.length === 0 ? (
                <div className="empty-state" style={{ padding: 20 }}>
                  <div className="empty-state-text">No branch data retrieved.</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                  {branches.map((b, i) => (
                    <div key={i} style={{ padding: '8px 12px', borderRadius: 'var(--radius)', background: 'var(--color-surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>🌿 {b.name}</span>
                      {b.protected && <span className="pill pill-primary" style={{ fontSize: 10 }}>protected</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
