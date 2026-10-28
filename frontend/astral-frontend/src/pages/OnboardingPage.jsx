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

