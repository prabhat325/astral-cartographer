<<<<<<< HEAD
import React, { useState } from 'react';
import { useAnalysis } from '../context/AnalysisContext';

export default function OnboardingPage() {
  const { state, setView, selectNode } = useAnalysis();
  const { result } = state;
  const [selectedPreviewFile, setSelectedPreviewFile] = useState(null);

  if (!result) return null;

  const arch = result.architecture;
  const repo = result.repository;
  const files = result.files || [];
  const nodes = arch?.nodes || [];
  const onboarding = arch?.onboarding || {};
  const goodFirstIssues = onboarding.goodFirstIssues || [];
  const coreHubs = onboarding.coreHubs || [];

  // Group other modules into Stage 2 (Utilities/Config) and Stage 3 (Feature/UI)
  const utilNodes = nodes.filter(
    (n) => (n.cluster === 'utils' || n.cluster === 'config') &&
           !goodFirstIssues.some((g) => g.file === n.id) &&
           !coreHubs.some((c) => c.file === n.id)
  );

  const featureNodes = nodes.filter(
    (n) => (n.cluster === 'ui' || n.cluster === 'api' || n.cluster === 'state') &&
           !goodFirstIssues.some((g) => g.file === n.id) &&
           !coreHubs.some((c) => c.file === n.id)
  );

  const handleInspectInGraph = (fileId) => {
    const node = nodes.find((n) => n.id === fileId);
    if (node) selectNode(node);
    setView('dependency');
  };

  const handlePreviewCode = (fileId) => {
    const file = files.find((f) => f.path === fileId);
    if (file) {
      setSelectedPreviewFile(file);
    } else {
      const node = nodes.find((n) => n.id === fileId);
      if (node) selectNode(node);
      setView('codeExplorer');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 1100, margin: '0 auto', width: '100%', paddingBottom: 40 }}>
      {/* Header Banner */}
      <div className="fade-in" style={{
        background: 'linear-gradient(135deg, rgba(65,86,171,0.08) 0%, rgba(152,169,255,0.12) 100%)',
        border: '1px solid rgba(65,86,171,0.2)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div className="section-eyebrow" style={{ color: 'var(--color-primary)' }}>Developer Onboarding & Mentorship</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-on-surface)', marginTop: 4 }}>
            Codebase Pathfinder
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', marginTop: 6, maxWidth: 600 }}>
            Automated mental model for new contributors to <strong style={{ color: 'var(--color-primary)' }}>{repo?.fullName || 'this repository'}</strong>.
            Follow the 4-phase learning pathway to ramp up smoothly from isolated leaf tasks to core orchestrators.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setView('dependency')}>
            Explore Dependency Graph
          </button>
        </div>
      </div>

      {/* 4-Stage Pathway Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ── STAGE 1: Good First Issues & Safe Entry Points ──────── */}
        <section className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: 'rgba(16,185,129,0.15)',
              color: 'var(--color-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14
            }}>1</div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-on-surface)' }}>
                Stage 1: Good First Issues & Safe Entry Points
              </h2>
              <p style={{ fontSize: 12, color: 'var(--color-on-surface-variant)' }}>
                Isolated modules with low Cyclomatic Complexity (≤ 5) and zero/low blast radius. Perfect for newcomer PRs.
              </p>
            </div>
            <span className="pill pill-clean" style={{ marginLeft: 'auto' }}>
              {goodFirstIssues.length} Recommended
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {goodFirstIssues.length === 0 ? (
              <div className="card" style={{ padding: 20 }}>
                <span style={{ color: 'var(--color-outline)' }}>All modules in this repo have higher coupling. Review Stage 2 utilities first.</span>
              </div>
            ) : (
              goodFirstIssues.map((item) => (
                <div key={item.file} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, borderLeft: '4px solid var(--color-emerald)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--color-on-surface)' }}>
                        {item.name || item.file}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-outline)', marginTop: 2 }}>{item.file}</div>
                    </div>
                    <span className="pill pill-clean" style={{ fontSize: 10 }}>Safe Entry</span>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', lineHeight: 1.5 }}>
                    {item.recommendation}
                  </p>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11 }}>
                    <span className="pill pill-neutral">LOC: {item.loc}</span>
                    <span className="pill pill-neutral">CC: {item.complexity}</span>
                    <span className="pill pill-neutral">Impact: {Math.round(item.blastRatio * 100)}%</span>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--color-outline-variant)' }}>
                    <button className="btn btn-secondary" style={{ flex: 1, fontSize: 11, padding: '4px 8px' }} onClick={() => handleInspectInGraph(item.file)}>
                      Inspect in Graph
                    </button>
                    <button className="btn btn-primary" style={{ flex: 1, fontSize: 11, padding: '4px 8px' }} onClick={() => handlePreviewCode(item.file)}>
                      Preview Code
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── STAGE 2: Foundation Utilities & Contracts ─────────────── */}
        <section className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: 'rgba(59,130,246,0.15)',
              color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14
            }}>2</div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-on-surface)' }}>
                Stage 2: Utilities, Shared Types & Configs
              </h2>
              <p style={{ fontSize: 12, color: 'var(--color-on-surface-variant)' }}>
                Pure helpers and schema configurations that define how data flows through the application.
              </p>
            </div>
            <span className="pill pill-primary" style={{ marginLeft: 'auto' }}>
              {utilNodes.length} Modules
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {utilNodes.slice(0, 6).map((node) => (
              <div key={node.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{node.name}</div>
                <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)' }}>
                  Cluster: <code>{node.cluster}</code> · In: {node.inDegree} · Out: {node.outDegree}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button className="btn btn-secondary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => handleInspectInGraph(node.id)}>Graph</button>
                  <button className="btn btn-secondary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => handlePreviewCode(node.id)}>Code</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── STAGE 3: Domain Components & Feature Services ─────────── */}
        {featureNodes.length > 0 && (
          <section className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: 'rgba(168,85,247,0.15)',
                color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 14
              }}>3</div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-on-surface)' }}>
                  Stage 3: Feature Services & UI Components
                </h2>
                <p style={{ fontSize: 12, color: 'var(--color-on-surface-variant)' }}>
                  User-facing components and services that implement specific business capabilities.
                </p>
              </div>
              <span className="pill pill-neutral" style={{ marginLeft: 'auto' }}>
                {featureNodes.length} Modules
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {featureNodes.slice(0, 6).map((node) => (
                <div key={node.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{node.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)' }}>
                    Cluster: <code>{node.cluster}</code> · Complexity: {node.complexity} · LOC: {node.loc?.code || node.loc?.total}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button className="btn btn-secondary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => handleInspectInGraph(node.id)}>Graph</button>
                    <button className="btn btn-secondary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => handlePreviewCode(node.id)}>Code</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── STAGE 4: Core Architectural Hubs (Must Read First) ───── */}
        <section className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: 'rgba(239,68,68,0.15)',
              color: 'var(--color-coral)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14
            }}>4</div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-on-surface)' }}>
                Stage 4: Core Architectural Hubs & Orchestrators
              </h2>
              <p style={{ fontSize: 12, color: 'var(--color-on-surface-variant)' }}>
                Critical high-coupling modules that govern system workflow. Modify with extreme caution.
              </p>
            </div>
            <span className="pill pill-error" style={{ marginLeft: 'auto' }}>
              {coreHubs.length} High Impact
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {coreHubs.map((hub) => (
              <div key={hub.file} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, borderLeft: '4px solid var(--color-coral)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--color-on-surface)' }}>
                      {hub.name || hub.file}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-outline)', marginTop: 2 }}>{hub.file}</div>
                  </div>
                  <span className="pill pill-error" style={{ fontSize: 10 }}>Core Hub</span>
                </div>

                <p style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', lineHeight: 1.5 }}>
                  {hub.recommendation}
                </p>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11 }}>
                  <span className="pill pill-warn">Dependents: {hub.dependentsCount}</span>
                  <span className="pill pill-warn">Blast Impact: {Math.round(hub.blastRatio * 100)}%</span>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--color-outline-variant)' }}>
                  <button className="btn btn-secondary" style={{ flex: 1, fontSize: 11, padding: '4px 8px' }} onClick={() => handleInspectInGraph(hub.file)}>
                    Inspect in Graph
                  </button>
                  <button className="btn btn-primary" style={{ flex: 1, fontSize: 11, padding: '4px 8px' }} onClick={() => handlePreviewCode(hub.file)}>
                    Preview Code
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Code Preview Modal if opened */}
      {selectedPreviewFile && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24
        }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: 800, maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-outline-variant)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>{selectedPreviewFile.path}</span>
              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setSelectedPreviewFile(null)}>Close</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              <pre className="code-block" style={{ fontSize: 12, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {selectedPreviewFile.content}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

=======
import React, { useState, useMemo } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import { 
  Compass, 
  ShieldCheck, 
  BookOpen, 
  Search, 
  FileCode2, 
  Network
} from 'lucide-react';

export default function OnboardingPage() {
  const { state, navigateToCodeExplorer, navigateToGraph } = useAnalysis();
  const { result } = state;

  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'ISSUES' | 'HUBS'
  const [searchTerm, setSearchTerm] = useState('');

  const arch = result?.architecture;
  const nodes = arch?.nodes || [];
  const onboarding = arch?.onboarding || {};

  const nodeMap = new Map();
  nodes.forEach(n => nodeMap.set(n.id, n));

  const rawIssues = onboarding.goodFirstIssues || [];
  const rawHubs = onboarding.coreHubs || [];

  // Fallback if onboarding was not precomputed: synthesize safe leaves and core hubs directly from nodes
  const goodFirstIssues = useMemo(() => {
    if (rawIssues.length > 0) return rawIssues;
    return nodes
      .filter(n => (n.complexity || 1) <= 4 && (n.inDegree || 0) <= 1 && (n.loc?.code || 10) <= 60)
      .slice(0, 10)
      .map(n => ({
        file: n.id,
        name: n.name,
        complexity: n.complexity,
        loc: n.loc?.code ?? 10,
        blastRatio: n.blastRadius?.ratio ?? 0,
        recommendation: 'Safe, isolated module ideal for newcomer PRs (minimal blast radius).'
      }));
  }, [rawIssues, nodes]);

  const coreHubs = useMemo(() => {
    if (rawHubs.length > 0) return rawHubs;
    return nodes
      .filter(n => (n.inDegree || 0) >= 2 || (n.blastRadius?.ratio || 0) >= 0.3)
      .slice(0, 10)
      .map(n => ({
        file: n.id,
        name: n.name,
        dependentsCount: n.inDegree,
        blastRatio: n.blastRadius?.ratio ?? 0,
        recommendation: 'Core architectural hub. Read first to understand overall repository flow.'
      }));
  }, [rawHubs, nodes]);

  const filteredIssues = useMemo(() => {
    if (activeTab === 'HUBS') return [];
    const q = searchTerm.toLowerCase().trim();
    if (!q) return goodFirstIssues;
    return goodFirstIssues.filter(f => (f.file || f.name || '').toLowerCase().includes(q));
  }, [goodFirstIssues, activeTab, searchTerm]);

  const filteredHubs = useMemo(() => {
    if (activeTab === 'ISSUES') return [];
    const q = searchTerm.toLowerCase().trim();
    if (!q) return coreHubs;
    return coreHubs.filter(h => (h.file || h.name || '').toLowerCase().includes(q));
  }, [coreHubs, activeTab, searchTerm]);

  if (!result) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
        No repository analyzed yet. Load a repository to view onboarding pathways.
      </div>
    );
  }

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
        background: 'linear-gradient(135deg, #FFFDFB 0%, #F8F3EA 100%)',
        border: '1.5px solid var(--border-gold-solid)'
      }}>
        <div className="section-eyebrow">
          <Compass size={12} color="var(--color-antique-gold)" />
          <span>New Contributor Acceleration & Architecture Tour</span>
        </div>
        <h1 className="section-title">Smart Onboarding Pathways</h1>
        <p className="section-subtitle" style={{ marginTop: 6 }}>
          Automated guidance designed to help engineers ramp up in this codebase quickly by distinguishing safe newcomer leaf modules from foundational architectural hubs.
        </p>
      </div>

      {/* Metrics Banner */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Good First PR Targets</div>
          <div className="stat-value" style={{ color: 'var(--status-emerald)' }}>
            {goodFirstIssues.length}
          </div>
          <div className="stat-meta">Isolated leaf modules</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Core Hubs to Read</div>
          <div className="stat-value" style={{ color: 'var(--color-antique-gold)' }}>
            {coreHubs.length}
          </div>
          <div className="stat-meta">High inward coupling</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Average Blast Radius</div>
          <div className="stat-value">
            {Math.round((goodFirstIssues.reduce((acc, curr) => acc + (curr.blastRatio || 0), 0) / (goodFirstIssues.length || 1)) * 100)}%
          </div>
          <div className="stat-meta">For beginner modules</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Ramp-Up Rating</div>
          <div className="stat-value" style={{ color: 'var(--status-emerald)' }}>
            {goodFirstIssues.length >= 3 ? 'High' : 'Moderate'}
          </div>
          <div className="stat-meta">Newcomer onboarding friction</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="royal-card fade-in" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--color-warm-ivory)',
            border: '1px solid var(--border-gold-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0 12px',
            gap: 8,
            minWidth: 260,
            flex: 1
          }}>
            <Search size={15} color="var(--text-muted)" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search onboarding files…"
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                padding: '9px 0',
                fontSize: 13,
                fontFamily: 'var(--font-sans)',
                color: 'var(--color-deep-burgundy)',
                width: '100%'
              }}
            />
          </div>

          <div className="tab-bar" style={{ width: 'auto' }}>
            <button
              type="button"
              className={`tab-item${activeTab === 'ALL' ? ' active' : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              All Pathways ({goodFirstIssues.length + coreHubs.length})
            </button>
            <button
              type="button"
              className={`tab-item${activeTab === 'ISSUES' ? ' active' : ''}`}
              onClick={() => setActiveTab('ISSUES')}
            >
              Safe Entry Modules ({goodFirstIssues.length})
            </button>
            <button
              type="button"
              className={`tab-item${activeTab === 'HUBS' ? ' active' : ''}`}
              onClick={() => setActiveTab('HUBS')}
            >
              Core Hubs ({coreHubs.length})
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout or Single Filtered Stream */}
      <div style={{ display: 'grid', gridTemplateColumns: activeTab === 'ALL' ? '1fr 1fr' : '1fr', gap: 24 }}>
        {/* Safe Entry Modules */}
        {(activeTab === 'ALL' || activeTab === 'ISSUES') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--color-deep-burgundy)',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <ShieldCheck size={18} color="var(--status-emerald)" />
                <span>Safe Entry Modules (Minimal Blast Radius)</span>
              </div>
              <span className="pill pill-emerald">{filteredIssues.length}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredIssues.length === 0 ? (
                <div className="royal-card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No beginner modules matching criteria.
                </div>
              ) : (
                filteredIssues.map((item, i) => {
                  const node = nodeMap.get(item.file);
                  return (
                    <div
                      key={item.file || i}
                      className="royal-card fade-in"
                      style={{
                        padding: '18px 20px',
                        borderLeft: '4px solid var(--status-emerald)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: 'var(--color-deep-burgundy)'
                        }}>
                          {item.file || item.name}
                        </div>
                        <span className="pill pill-emerald">
                          CC {item.complexity ?? 1} · {item.loc ?? 0} LOC
                        </span>
                      </div>

                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {item.recommendation || 'Safe, isolated module ideal for newcomer PRs.'}
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 6,
                        paddingTop: 10,
                        borderTop: '1px solid var(--border-gold-subtle)'
                      }}>
                        <span style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          Blast radius: {Math.round((item.blastRatio || 0) * 100)}% of codebase
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            className="btn btn-royal"
                            style={{ padding: '4px 10px', fontSize: 11.5 }}
                            onClick={() => navigateToCodeExplorer(item.file)}
                          >
                            <FileCode2 size={12} color="var(--color-antique-gold)" />
                            <span>Code</span>
                          </button>
                          {node && (
                            <button
                              type="button"
                              className="btn btn-gold"
                              style={{ padding: '4px 10px', fontSize: 11.5 }}
                              onClick={() => navigateToGraph(node, 'modules')}
                            >
                              <Network size={12} />
                              <span>Graph</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Core Architectural Hubs */}
        {(activeTab === 'ALL' || activeTab === 'HUBS') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--color-deep-burgundy)',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <BookOpen size={18} color="var(--color-antique-gold)" />
                <span>Core Architectural Hubs (Read First)</span>
              </div>
              <span className="pill pill-gold">{filteredHubs.length}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredHubs.length === 0 ? (
                <div className="royal-card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No core hub files matching criteria.
                </div>
              ) : (
                filteredHubs.map((item, i) => {
                  const node = nodeMap.get(item.file);
                  return (
                    <div
                      key={item.file || i}
                      className="royal-card fade-in"
                      style={{
                        padding: '18px 20px',
                        borderLeft: '4px solid var(--color-antique-gold)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: 'var(--color-deep-burgundy)'
                        }}>
                          {item.file || item.name}
                        </div>
                        <span className="pill pill-gold">
                          {item.dependentsCount ?? 0} Dependents
                        </span>
                      </div>

                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {item.recommendation || 'Fundamental hub defining core data flow.'}
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 6,
                        paddingTop: 10,
                        borderTop: '1px solid var(--border-gold-subtle)'
                      }}>
                        <span style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          Centrality index: {Math.round((item.blastRatio || 0.4) * 100)}%
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            className="btn btn-royal"
                            style={{ padding: '4px 10px', fontSize: 11.5 }}
                            onClick={() => navigateToCodeExplorer(item.file)}
                          >
                            <FileCode2 size={12} color="var(--color-antique-gold)" />
                            <span>Code</span>
                          </button>
                          {node && (
                            <button
                              type="button"
                              className="btn btn-gold"
                              style={{ padding: '4px 10px', fontSize: 11.5 }}
                              onClick={() => navigateToGraph(node, 'modules')}
                            >
                              <Network size={12} />
                              <span>Graph</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
>>>>>>> ba361f3 (updated frontend)
