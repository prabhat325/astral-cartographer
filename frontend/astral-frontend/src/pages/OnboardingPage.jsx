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
