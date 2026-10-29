import React, { useState } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Network
} from 'lucide-react';

export default function CircularPage() {
  const { state, navigateToGraph, navigateToCodeExplorer } = useAnalysis();
  const { result } = state;

  const [expandedIndices, setExpandedIndices] = useState(new Set([0, 1, 2]));

  const arch = result?.architecture;
  const cycles = arch?.circularCycles || [];
  const nodes = arch?.nodes || [];

  const nodeMap = new Map();
  nodes.forEach(n => nodeMap.set(n.id, n));

  const totalCycles = cycles.length;
  const involvedModules = new Set(cycles.flat());
  const maxDepth = cycles.reduce((max, c) => Math.max(max, c.length), 0);

  function toggleIndex(idx) {
    setExpandedIndices(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function handleExpandAll() {
    if (expandedIndices.size === cycles.length) {
      setExpandedIndices(new Set());
    } else {
      setExpandedIndices(new Set(cycles.map((_, i) => i)));
    }
  }

  if (!result) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
        No repository analyzed yet. Load a repository to view circular dependencies.
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
        background: 'linear-gradient(135deg, #FFFDFB 0%, #FBF0F2 100%)',
        border: '1.5px solid var(--border-gold-solid)'
      }}>
        <div className="section-eyebrow">
          <AlertTriangle size={12} color="var(--status-rose)" />
          <span>Topological Cycle Detection & Recursion Traps</span>
        </div>
        <h1 className="section-title">Circular Dependencies Audit</h1>
        <p className="section-subtitle" style={{ marginTop: 6 }}>
          Circular import cycles prevent clean tree-shaking, create initialization deadlocks, and severely undermine modular decoupling.
        </p>
      </div>

      {/* Summary Scorecard */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderColor: totalCycles ? 'rgba(185, 56, 85, 0.4)' : undefined }}>
          <div className="stat-label">Total Circular Cycles</div>
          <div className="stat-value" style={{ color: totalCycles ? 'var(--status-rose)' : 'var(--status-emerald)' }}>
            {totalCycles}
          </div>
          <div className="stat-meta">{totalCycles ? 'Decoupling recommended' : 'Clean hierarchy'}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Entangled Modules</div>
          <div className="stat-value" style={{ color: involvedModules.size ? 'var(--status-amber)' : 'inherit' }}>
            {involvedModules.size}
          </div>
          <div className="stat-meta">Participating in cycles</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Longest Recursion Hop</div>
          <div className="stat-value">
            {maxDepth}
          </div>
          <div className="stat-meta">Chain traversal depth</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Topology Cleanliness</div>
          <div className="stat-value" style={{ color: totalCycles === 0 ? 'var(--status-emerald)' : 'var(--color-antique-gold)' }}>
            {totalCycles === 0 ? '100%' : `${Math.max(15, 100 - totalCycles * 20)}%`}
          </div>
          <div className="stat-meta">Directional acyclic score</div>
        </div>
      </div>

      {/* Main Cycle Listing */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
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
            <span>Detected Circular Loops ({cycles.length})</span>
          </div>

          {cycles.length > 0 && (
            <button
              type="button"
              className="btn btn-royal"
              onClick={handleExpandAll}
              style={{ fontSize: 12, padding: '6px 14px' }}
            >
              {expandedIndices.size === cycles.length ? 'Collapse All Loops' : 'Expand All Loops'}
            </button>
          )}
        </div>

        {cycles.length === 0 ? (
          <div className="royal-card fade-in" style={{ padding: '36px', border: '1.5px solid rgba(34, 139, 88, 0.4)' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <CheckCircle2 size={32} color="var(--status-emerald)" style={{ flexShrink: 0 }} />
              <div>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--status-emerald)',
                  marginBottom: 6
                }}>
                  Zero Circular Dependencies Found
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Congratulations! All file import topology in this repository forms a strictly acyclic directional graph (DAG). There are no recursive import loops to remediate.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {cycles.map((cycle, i) => {
              const isOpen = expandedIndices.has(i);
              const cycleArr = Array.isArray(cycle) ? cycle : cycle?.nodes || [];

              return (
                <div
                  key={i}
                  className="royal-card fade-in"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    border: '1.5px solid rgba(185, 56, 85, 0.35)',
                    boxShadow: '0 4px 16px rgba(185, 56, 85, 0.06)'
                  }}
                >
                  {/* Card Header Bar */}
                  <div
                    onClick={() => toggleIndex(i)}
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      background: 'linear-gradient(135deg, #FFFDFB 0%, #FAF0F2 100%)',
                      gap: 14
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'rgba(185, 56, 85, 0.12)',
                        color: 'var(--status-rose)',
                        fontSize: 12,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-mono)',
                        flexShrink: 0
                      }}>
                        #{i + 1}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--color-deep-burgundy)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {cycleArr[0]} <span style={{ color: 'var(--status-rose)' }}>↔</span> {cycleArr[1] || 'Cycle'}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                          Cycle span: {cycleArr.length} modules involved
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span className="pill pill-error">
                        Circular
                      </span>
                      {isOpen ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                    </div>
                  </div>

                  {/* Expanded Cycle Body */}
                  {isOpen && (
                    <div style={{
                      padding: '18px 24px',
                      borderTop: '1px solid var(--border-gold-subtle)',
                      background: 'var(--color-pearl-white)'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {cycleArr.map((nodeId, idx, arr) => {
                          const n = nodeMap.get(nodeId);
                          return (
                            <React.Fragment key={idx}>
                              <div style={{
                                padding: '10px 14px',
                                background: 'var(--color-warm-ivory)',
                                border: '1px solid var(--border-gold-subtle)',
                                borderRadius: 'var(--radius-sm)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 10
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: 'var(--color-antique-gold)'
                                  }}>
                                    [{idx + 1}]
                                  </span>
                                  <span style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 12.5,
                                    fontWeight: 600,
                                    color: 'var(--color-deep-burgundy)'
                                  }}>
                                    {nodeId}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', gap: 6 }}>
                                  {n && (
                                    <span className="pill pill-gold" style={{ height: 18, fontSize: 10 }}>
                                      CC {n.complexity} · {n.loc?.code ?? 10} LOC
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    className="btn-ghost"
                                    style={{ padding: '2px 8px', fontSize: 11 }}
                                    onClick={() => navigateToCodeExplorer(nodeId)}
                                    title="Inspect in Code Explorer"
                                  >
                                    View Code
                                  </button>
                                </div>
                              </div>

                              {idx < arr.length - 1 && (
                                <div style={{
                                  fontSize: 11.5,
                                  color: 'var(--status-rose)',
                                  padding: '0 20px',
                                  fontFamily: 'var(--font-mono)',
                                  fontWeight: 600
                                }}>
                                  ↓ imports
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}

                        <div style={{
                          fontSize: 11.5,
                          color: 'var(--status-rose)',
                          padding: '6px 20px 0',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700
                        }}>
                          ↩ Recursively cycles back to module: {cycleArr[0]}
                        </div>
                      </div>

                      {/* Trace in Graph Action */}
                      <div style={{
                        marginTop: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: 14,
                        borderTop: '1px solid var(--border-gold-subtle)'
                      }}>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          Click below to visually trace this circular vector in the topological force graph:
                        </div>
                        <button
                          type="button"
                          className="btn btn-gold"
                          style={{ fontSize: 12.5, padding: '7px 16px' }}
                          onClick={() => {
                            const firstNode = nodeMap.get(cycleArr[0]);
                            navigateToGraph(firstNode, 'modules');
                          }}
                        >
                          <Network size={14} />
                          <span>Trace Loop in Graph</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Remediation Architectural Guidance */}
      <div className="royal-card fade-in" style={{ padding: '24px' }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--color-deep-burgundy)',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <Sparkles size={18} color="var(--color-antique-gold)" />
          <span>Architectural Remediation Playbook</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <div style={{
            background: 'var(--color-warm-ivory)',
            border: '1px solid var(--border-gold-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-antique-gold)', marginBottom: 6 }}>
              1. Shared Utility Extraction
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Extract common helper functions or shared data models that both circular files require into a new, lower-tier module (e.g. <code>types.js</code> or <code>shared.js</code>).
            </div>
          </div>

          <div style={{
            background: 'var(--color-warm-ivory)',
            border: '1px solid var(--border-gold-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-antique-gold)', marginBottom: 6 }}>
              2. Dependency Inversion (DIP)
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Rather than directly importing a concrete implementation, inject callback functions or interface handlers at runtime into the consumer function.
            </div>
          </div>

          <div style={{
            background: 'var(--color-warm-ivory)',
            border: '1px solid var(--border-gold-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-antique-gold)', marginBottom: 6 }}>
              3. Dynamic Lazy Imports
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              If mutual dependencies are only needed inside rarely-called methods, defer loading using dynamic <code>import()</code> to break top-level evaluation cycles.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
