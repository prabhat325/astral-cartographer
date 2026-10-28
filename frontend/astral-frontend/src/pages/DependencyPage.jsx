import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import cytoscape from 'cytoscape';
import { useAnalysis } from '../context/AnalysisContext';
import { explainCode } from '../api/apiClient';

// ── Colour helpers ────────────────────────────────────────────────────────────
const EXT_COLORS = {
  '.js':'#f59e0b', '.jsx':'#f97316', '.ts':'#3b82f6', '.tsx':'#6366f1',
  '.py':'#10b981', '.go':'#06b6d4', '.rs':'#ef4444', '.java':'#8b5cf6',
  '.cpp':'#ec4899', '.c':'#14b8a6', '.h':'#84cc16', '.php':'#a855f7',
  'class':'#ec4899', 'function':'#8b5cf6'
};
const extColor = (ext, type) => {
  if (type === 'class') return EXT_COLORS.class;
  if (type === 'function') return EXT_COLORS.function;
  return EXT_COLORS[ext] || '#9ca3af';
};

// ── Layout options ─────────────────────────────────────────────────────────────
const LAYOUTS = {
  cose:         { name: 'cose', animate: true, randomize: false, idealEdgeLength: 90, nodeRepulsion: 4500 },
  breadthfirst: { name: 'breadthfirst', animate: true, spacingFactor: 1.3, directed: true },
  circle:       { name: 'circle', animate: true },
  grid:         { name: 'grid', animate: true },
  concentric:   { name: 'concentric', animate: true, minNodeSpacing: 50 },
};

// ── Legend ────────────────────────────────────────────────────────────────────
function Legend({ currentScope }) {
  return (
    <div className="graph-legend">
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        Legend · {currentScope.toUpperCase()}
      </div>
      {currentScope === 'files' && (
        <>
          {Object.entries(EXT_COLORS).slice(0, 6).map(([ext, color]) => (
            <div className="legend-item" key={ext}>
              <div className="legend-dot" style={{ background: color }} />
              <span>{ext}</span>
            </div>
          ))}
          <div className="divider" style={{ margin: '4px 0' }} />
          <div className="legend-item">
            <svg width="24" height="10"><line x1="0" y1="5" x2="24" y2="5" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 2"/></svg>
            <span>Circular</span>
          </div>
          <div className="legend-item">
            <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #f59e0b', background: 'transparent' }} />
            <span>God File</span>
          </div>
        </>
      )}
      {currentScope === 'classes' && (
        <div className="legend-item">
          <div className="legend-dot" style={{ background: EXT_COLORS.class }} />
          <span>Class / Struct</span>
        </div>
      )}
      {currentScope === 'functions' && (
        <div className="legend-item">
          <div className="legend-dot" style={{ background: EXT_COLORS.function }} />
          <span>Function / Method</span>
        </div>
      )}
    </div>
  );
}

// ── Node Inspector Panel with Code Preview & AI Explanation ──────────────────
function NodeInspector({ node, allEdges, files = [] }) {
  const [tab, setTab] = useState('details');
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  if (!node) {
    return (
      <div className="empty-state" style={{ padding: '40px 20px' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="empty-state-icon">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        <div className="empty-state-text">Click any node to inspect its dependencies, metrics, code preview, and AI explanation</div>
      </div>
    );
  }

  const fileObj = files.find(f => f.path === node.id || f.path === node.file);
  const depsOut = allEdges.filter(e => (e.source === node.id || e.source?.id === node.id));
  const depsIn  = allEdges.filter(e => (e.target === node.id || e.target?.id === node.id));

  const handleAskAI = async () => {
    if (!fileObj?.content) return;
    setAiLoading(true);
    try {
      const res = await explainCode(fileObj.content, fileObj.path, {
        cluster: node.cluster,
        complexity: node.complexity,
        inDegree: node.inDegree,
        outDegree: node.outDegree,
        blastRadius: node.blastRadius?.affectedCount,
        isGodFile: node.isGodFile
      });
      setAiText(res.explanation || 'No explanation returned.');
    } catch (err) {
      setAiText('AI explanation error: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      {/* Node Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: extColor(node.extension, node.type), flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {node.name}
          </span>
        </div>
        <span className="pill pill-neutral" style={{ fontSize: 10, flexShrink: 0 }}>{node.type || 'file'}</span>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ display: 'flex' }}>
        <button className={`tab-item${tab === 'details' ? ' active' : ''}`} style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => setTab('details')}>
          Metrics
        </button>
        <button className={`tab-item${tab === 'relationships' ? ' active' : ''}`} style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => setTab('relationships')}>
          Links ({depsOut.length + depsIn.length})
        </button>
        <button className={`tab-item${tab === 'code' ? ' active' : ''}`} style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => setTab('code')}>
          Code Preview
        </button>
        <button className={`tab-item${tab === 'ai' ? ' active' : ''}`} style={{ fontSize: 11, padding: '4px 8px', color: 'var(--color-primary)' }} onClick={() => { setTab('ai'); if (!aiText) handleAskAI(); }}>
          ✦ AI
        </button>
      </div>

      {/* TAB: Details / Metrics */}
      {tab === 'details' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
          {[
            ['Identifier', node.id],
            ['Type', node.type || 'file'],
            ['Cluster', node.cluster || '—'],
            ['Cyclomatic CC', node.complexity],
            ['In-degree (Dependents)', node.inDegree ?? 0],
            ['Out-degree (Dependencies)', node.outDegree ?? 0],
            ['LOC (Code)', node.loc?.code ?? node.loc?.total ?? '—'],
            ['Tokens', node.tokenCount ?? '—'],
            ['Blast Radius', node.blastRadius ? `${node.blastRadius.affectedCount} files (${Math.round(node.blastRadius.ratio * 100)}%)` : '—'],
            ['God File Risk', node.isGodFile ? 'CRITICAL GOD FILE' : (node.godFileScore ? `Score: ${node.godFileScore}` : 'Clean')],
          ].map(([k, v]) => (
            <div key={k} className="inspector-row">
              <span className="inspector-key">{k}</span>
              <span className="inspector-val" style={{ fontSize: 11, maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis' }}>{v}</span>
            </div>
          ))}

          {node.isGodFile && (
            <div className="alert alert-warn" style={{ marginTop: 8, fontSize: 12 }}>
              ⚠️ God File: High coupling and architectural centrality detected.
            </div>
          )}
        </div>
      )}

      {/* TAB: Relationships */}
      {tab === 'relationships' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', maxHeight: 350 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', marginBottom: 6 }}>
              Outgoing Dependencies ({depsOut.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {depsOut.map((e, i) => (
                <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '4px 8px', borderRadius: 4, background: 'var(--color-surface-container-low)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: e.isCircular ? 'var(--color-coral)' : 'var(--color-on-surface)' }}>
                  → {typeof e.target === 'object' ? e.target.id : e.target} {e.isCircular ? '🔁' : ''}
                </div>
              ))}
              {depsOut.length === 0 && <div style={{ fontSize: 11, color: 'var(--color-outline)' }}>None (Leaf node)</div>}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', marginBottom: 6 }}>
              Incoming Dependents ({depsIn.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {depsIn.map((e, i) => (
                <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '4px 8px', borderRadius: 4, background: 'var(--color-surface-container-low)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  ← {typeof e.source === 'object' ? e.source.id : e.source}
                </div>
              ))}
              {depsIn.length === 0 && <div style={{ fontSize: 11, color: 'var(--color-outline)' }}>None (Root entry point)</div>}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Code Preview */}
      {tab === 'code' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {fileObj ? (
            <pre className="code-block" style={{ fontSize: 11, lineHeight: 1.6, margin: 0, maxHeight: 380, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {fileObj.content}
            </pre>
          ) : (
            <div className="empty-state" style={{ padding: 20 }}>
              <div className="empty-state-text">No source content available for {node.name}</div>
            </div>
          )}
        </div>
      )}

      {/* TAB: AI Explanation */}
      {tab === 'ai' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
          <button className="btn btn-primary" style={{ fontSize: 11, padding: '4px 10px' }} onClick={handleAskAI} disabled={aiLoading}>
            {aiLoading ? 'Analyzing AST & Architecture…' : 'Re-run AI Explanation'}
          </button>
          {aiText ? (
            <div style={{ fontSize: 12, lineHeight: 1.6, padding: 10, background: 'var(--color-surface-container-low)', borderRadius: 'var(--radius)', border: '1px solid var(--color-outline-variant)' }}>
              {aiText.split('\n').map((l, idx) => (
                <div key={idx} style={{ marginBottom: l.startsWith('**') ? 6 : 2 }}>
                  {l}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 16 }}>
              <div className="empty-state-text">Click the button above to generate an architectural explanation.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function DependencyPage() {
  const { state, selectNode } = useAnalysis();
  const { result, selectedNode } = state;

  const cyRef      = useRef(null);
  const cyInstance = useRef(null);

  // View Scopes: 'files', 'classes', 'functions'
  const [scope, setScope] = useState('files');
  const [layout, setLayout] = useState('cose');
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCluster, setSelectedCluster] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all');

  // Dependency Tracing State
  const [tracingMode, setTracingMode] = useState('none'); // 'none' | 'upstream' | 'downstream' | 'path' | 'blast'
  const [pathTargetNode, setPathTargetNode] = useState('');
  const [activeCycleIndex, setActiveCycleIndex] = useState(-1);

  const arch     = result?.architecture;
  const files    = result?.files || [];
  const cycles   = useMemo(() => arch?.circularCycles || [], [arch]);

  // Determine active nodes & edges based on Scope
  const { currentNodes, currentEdges } = useMemo(() => {
    if (scope === 'classes') {
      return {
        currentNodes: arch?.classNodes || [],
        currentEdges: arch?.classEdges || []
      };
    }
    if (scope === 'functions') {
      return {
        currentNodes: arch?.functionNodes || [],
        currentEdges: arch?.functionEdges || []
      };
    }
    // Default 'files'
    return {
      currentNodes: arch?.nodes || [],
      currentEdges: arch?.edges || []
    };
  }, [arch, scope]);

  // Filter nodes based on search, cluster, and risk
  const filteredNodes = useMemo(() => {
    let list = currentNodes;
    if (selectedCluster !== 'all') {
      list = list.filter(n => n.cluster === selectedCluster);
    }
    if (selectedRisk === 'god') {
      list = list.filter(n => n.isGodFile);
    } else if (selectedRisk === 'highCC') {
      list = list.filter(n => (n.complexity || 1) > 8);
    } else if (selectedRisk === 'circular') {
      const cycleSet = new Set(cycles.flat());
      list = list.filter(n => cycleSet.has(n.id));
    }
    return list;
  }, [currentNodes, selectedCluster, selectedRisk, cycles]);

  // Level of detail limit (top 150)
  const visNodes = useMemo(() => {
    if (showAll || filteredNodes.length <= 150) return filteredNodes;
    return [...filteredNodes]
      .sort((a, b) => ((b.inDegree || 0) + (b.outDegree || 0)) - ((a.inDegree || 0) + (a.outDegree || 0)))
      .slice(0, 150);
  }, [filteredNodes, showAll]);

  const visNodeIds = useMemo(() => new Set(visNodes.map(n => n.id)), [visNodes]);
  const visEdges = useMemo(() => {
    return currentEdges.filter(e => visNodeIds.has(e.source) && visNodeIds.has(e.target));
  }, [currentEdges, visNodeIds]);

  // ── Build / Rebuild Cytoscape Instance ─────────────────────────
  const buildCytoscape = useCallback(() => {
    if (!cyRef.current || visNodes.length === 0) return;
    if (cyInstance.current) cyInstance.current.destroy();

    const elements = [
      ...visNodes.map(n => ({
        data: {
          id:        n.id,
          label:     n.name || n.id,
          color:     extColor(n.extension, n.type),
          size:      10 + Math.min(n.inDegree || 0, 12) * 2 + (n.isGodFile ? 10 : 0),
          isGodFile: n.isGodFile,
          ...n
        },
        classes: [n.isGodFile ? 'god-file' : '', n.cluster || ''].filter(Boolean).join(' ')
      })),
      ...visEdges.map((e, idx) => ({
        data: {
          id:         e.id || `${e.source}__${e.target}__${idx}`,
          source:     e.source,
          target:     e.target,
          isCircular: Boolean(e.isCircular)
        },
        classes: e.isCircular ? 'circular' : ''
      }))
    ];

    const cy = cytoscape({
      container: cyRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color':   'data(color)',
            'width':              'data(size)',
            'height':             'data(size)',
            'label':              'data(label)',
            'font-size':          9,
            'font-family':        'JetBrains Mono, monospace',
            'color':              '#171c25',
            'text-valign':        'bottom',
            'text-halign':        'center',
            'text-margin-y':      4,
            'text-wrap':          'ellipsis',
            'text-max-width':     85,
            'opacity':            0.9,
            'transition-property':'border-width border-color opacity',
            'transition-duration':'0.2s',
          }
        },
        {
          selector: 'node.god-file',
          style: {
            'border-width': 3,
            'border-color': '#f59e0b',
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 3.5,
            'border-color': '#4156ab',
            'opacity':       1,
          }
        },
        {
          selector: 'node.highlighted',
          style: { 'opacity': 1, 'border-width': 2.5, 'border-color': '#4156ab' }
        },
        {
          selector: 'node.dimmed',
          style: { 'opacity': 0.12 }
        },
        {
          selector: 'edge',
          style: {
            'line-color':            '#c5c5d3',
            'width':                 1,
            'opacity':               0.6,
            'curve-style':           'bezier',
            'target-arrow-shape':    'triangle',
            'target-arrow-color':    '#c5c5d3',
            'arrow-scale':           0.7,
            'transition-property':   'opacity line-color width',
            'transition-duration':   '0.2s',
          }
        },
        {
          selector: 'edge.circular',
          style: {
            'line-color':         '#ef4444',
            'target-arrow-color': '#ef4444',
            'width':              2,
            'line-style':         'dashed',
            'opacity':            0.9,
          }
        },
        {
          selector: 'edge.highlighted',
          style: {
            'line-color':         '#4156ab',
            'target-arrow-color': '#4156ab',
            'width':              2.5,
            'opacity':            1,
          }
        },
        {
          selector: 'edge.dimmed',
          style: { 'opacity': 0.05 }
        },
      ],
      layout: LAYOUTS[layout] || LAYOUTS.cose,
      wheelSensitivity: 0.25,
    });

    cyInstance.current = cy;

    // Tap node
    cy.on('tap', 'node', (evt) => {
      const nodeData = evt.target.data();
      selectNode(nodeData);
    });

    // Tap canvas background
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        selectNode(null);
        cy.elements().removeClass('dimmed highlighted');
      }
    });

  }, [visNodes, visEdges, layout, selectNode]);

  useEffect(() => {
    buildCytoscape();
    return () => { if (cyInstance.current) cyInstance.current.destroy(); };
  }, [buildCytoscape]);

  // ── Dependency Tracing Effects ─────────────────────────────────
  useEffect(() => {
    const cy = cyInstance.current;
    if (!cy) return;

    if (!selectedNode && tracingMode === 'none' && !searchTerm) {
      cy.elements().removeClass('dimmed highlighted');
      return;
    }

    if (selectedNode) {
      const nodeElem = cy.getElementById(selectedNode.id);
      if (!nodeElem.length) return;

      cy.elements().addClass('dimmed').removeClass('highlighted');
      nodeElem.addClass('highlighted').removeClass('dimmed');

      if (tracingMode === 'downstream') {
        // Trace all outgoing paths
        cy.elements().bfs({
          roots: nodeElem,
          directed: true,
          visit: (v) => { v.addClass('highlighted').removeClass('dimmed'); }
        });
      } else if (tracingMode === 'upstream') {
        // Trace all incoming paths (reverse edges)
        cy.elements().bfs({
          roots: nodeElem,
          directed: false,
          visit: (v, e) => {
            if (e && e.target().id() === v.id()) {
              v.addClass('highlighted').removeClass('dimmed');
            }
          }
        });
      } else if (tracingMode === 'blast' && selectedNode.blastRadius?.affectedFiles) {
        // Highlight all blast radius files
        selectedNode.blastRadius.affectedFiles.forEach((fileId) => {
          cy.getElementById(fileId).addClass('highlighted').removeClass('dimmed');
        });
      } else if (tracingMode === 'path' && pathTargetNode) {
        // Shortest path between selectedNode and pathTargetNode
        const targetElem = cy.getElementById(pathTargetNode);
        if (targetElem.length) {
          const aStar = cy.elements().aStar({ root: nodeElem, goal: targetElem, directed: true });
          if (aStar.found) {
            aStar.path.addClass('highlighted').removeClass('dimmed');
          }
        }
      } else {
        // Default: 1-hop closed neighborhood
        nodeElem.closedNeighborhood().addClass('highlighted').removeClass('dimmed');
      }
    }
  }, [selectedNode, tracingMode, pathTargetNode, searchTerm]);

  // ── Search Highlighting ─────────────────────────────────────────
  useEffect(() => {
    const cy = cyInstance.current;
    if (!cy || !searchTerm.trim()) return;
    const q = searchTerm.toLowerCase();
    cy.elements().addClass('dimmed').removeClass('highlighted');
    cy.nodes().filter(n => (n.data('label') || '').toLowerCase().includes(q))
      .addClass('highlighted').removeClass('dimmed')
      .closedNeighborhood().addClass('highlighted').removeClass('dimmed');
  }, [searchTerm]);

  // ── Circular Cycle Spotlight ───────────────────────────────────
  const handleSpotlightCycle = (cycleIdx) => {
    const cy = cyInstance.current;
    if (!cy || cycleIdx < 0 || !cycles[cycleIdx]) return;
    setActiveCycleIndex(cycleIdx);
    const cycleNodes = cycles[cycleIdx];

    cy.elements().addClass('dimmed').removeClass('highlighted');
    cycleNodes.forEach((nodeId) => {
      const el = cy.getElementById(nodeId);
      if (el.length) el.addClass('highlighted').removeClass('dimmed');
    });

    // Also highlight edges between these nodes
    cy.edges().forEach((edge) => {
      if (cycleNodes.includes(edge.data('source')) && cycleNodes.includes(edge.data('target'))) {
        edge.addClass('highlighted').removeClass('dimmed');
      }
    });

    // Center on the first cycle node
    const firstEl = cy.getElementById(cycleNodes[0]);
    if (firstEl.length) {
      cy.animate({ center: { eles: firstEl }, zoom: 1.2, duration: 400 });
    }
  };

  // Export PNG Image
  const handleExportPng = () => {
    const cy = cyInstance.current;
    if (!cy) return;
    const png = cy.png({ full: true, scale: 2, bg: '#ffffff' });
    const a = document.createElement('a');
    a.href = png;
    a.download = `astral-graph-${scope}.png`;
    a.click();
  };

  // Export JSON
  const handleExportJson = () => {
    const cy = cyInstance.current;
    if (!cy) return;
    const data = cy.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `astral-graph-${scope}.json`;
    a.click();
  };

  if (!result) return null;

  return (
    <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 64px - 48px)', minHeight: 520, maxWidth: 1440, margin: '0 auto', width: '100%' }}>

      {/* ── Main Graph Area ───────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>

        {/* Top Control Bar: Scope, Filters, and Tracing */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          {/* Left: Scope Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase' }}>Scope:</span>
            <div className="tab-bar" style={{ display: 'inline-flex' }}>
              <button className={`tab-item${scope === 'files' ? ' active' : ''}`} style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => { setScope('files'); selectNode(null); }}>
                📁 Files ({arch?.nodes?.length || 0})
              </button>
              <button className={`tab-item${scope === 'classes' ? ' active' : ''}`} style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => { setScope('classes'); selectNode(null); }}>
                🏛️ Classes ({arch?.classNodes?.length || 0})
              </button>
              <button className={`tab-item${scope === 'functions' ? ' active' : ''}`} style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => { setScope('functions'); selectNode(null); }}>
                ⚡ Functions ({arch?.functionNodes?.length || 0})
              </button>
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {/* Search */}
            <input
              className="input"
              placeholder={`Search ${scope}…`}
              style={{ width: 140, fontSize: 11, height: 28 }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />

            {/* Filter by Cluster */}
            <select className="input" style={{ fontSize: 11, width: 110, height: 28 }} value={selectedCluster} onChange={e => setSelectedCluster(e.target.value)}>
              <option value="all">All Layers</option>
              <option value="core">Core</option>
              <option value="ui">UI</option>
              <option value="api">API</option>
              <option value="state">State</option>
              <option value="utils">Utils</option>
              <option value="config">Config</option>
            </select>

            {/* Filter by Risk */}
            <select className="input" style={{ fontSize: 11, width: 110, height: 28 }} value={selectedRisk} onChange={e => setSelectedRisk(e.target.value)}>
              <option value="all">All Health</option>
              <option value="god">God Files</option>
              <option value="circular">In Cycles</option>
              <option value="highCC">High CC (&gt;8)</option>
            </select>

            {/* Layout selector */}
            <select className="input" style={{ fontSize: 11, width: 110, height: 28 }} value={layout} onChange={e => setLayout(e.target.value)}>
              <option value="cose">CoSE (Force)</option>
              <option value="breadthfirst">Breadth First</option>
              <option value="concentric">Concentric</option>
              <option value="circle">Circle</option>
              <option value="grid">Grid</option>
            </select>

            {/* Re-layout */}
            <button className="btn btn-secondary" style={{ fontSize: 11, height: 28, padding: '0 8px' }} onClick={() => cyInstance.current?.layout(LAYOUTS[layout]).run()} title="Recompute layout">
              ↺ Layout
            </button>

            {/* Zoom / Fit buttons */}
            <button className="btn btn-icon" style={{ height: 28, width: 28 }} title="Fit to Screen" onClick={() => cyInstance.current?.fit(undefined, 30)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            </button>
            <button className="btn btn-icon" style={{ height: 28, width: 28 }} title="Zoom In" onClick={() => cyInstance.current?.zoom({ level: (cyInstance.current.zoom() || 1) * 1.3, renderedPosition: { x: cyRef.current?.clientWidth / 2, y: cyRef.current?.clientHeight / 2 } })}>
              +
            </button>
            <button className="btn btn-icon" style={{ height: 28, width: 28 }} title="Zoom Out" onClick={() => cyInstance.current?.zoom({ level: (cyInstance.current.zoom() || 1) * 0.77, renderedPosition: { x: cyRef.current?.clientWidth / 2, y: cyRef.current?.clientHeight / 2 } })}>
              -
            </button>

            {/* Export Menu */}
            <button className="btn btn-secondary" style={{ fontSize: 11, height: 28, padding: '0 8px' }} onClick={handleExportPng} title="Export graph as PNG">
              📷 PNG
            </button>
            <button className="btn btn-secondary" style={{ fontSize: 11, height: 28, padding: '0 8px' }} onClick={handleExportJson} title="Export graph JSON">
              💾 JSON
            </button>
          </div>
        </div>

        {/* Secondary Bar: Dependency Tracing & Cycle Spotlights */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--color-surface-container-low)', borderRadius: 'var(--radius)', border: '1px solid var(--color-outline-variant)', fontSize: 11, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Trace Mode:</span>
            <button className={`pill ${tracingMode === 'none' ? 'pill-primary' : 'pill-neutral'}`} style={{ cursor: 'pointer' }} onClick={() => setTracingMode('none')}>1-Hop</button>
            <button className={`pill ${tracingMode === 'downstream' ? 'pill-primary' : 'pill-neutral'}`} style={{ cursor: 'pointer' }} onClick={() => setTracingMode('downstream')}>Downstream</button>
            <button className={`pill ${tracingMode === 'upstream' ? 'pill-primary' : 'pill-neutral'}`} style={{ cursor: 'pointer' }} onClick={() => setTracingMode('upstream')}>Upstream</button>
            <button className={`pill ${tracingMode === 'blast' ? 'pill-primary' : 'pill-neutral'}`} style={{ cursor: 'pointer' }} onClick={() => setTracingMode('blast')}>Blast Radius</button>
            <button className={`pill ${tracingMode === 'path' ? 'pill-primary' : 'pill-neutral'}`} style={{ cursor: 'pointer' }} onClick={() => setTracingMode('path')}>Shortest Path</button>

            {tracingMode === 'path' && (
              <select className="input" style={{ fontSize: 11, height: 24, width: 140 }} value={pathTargetNode} onChange={e => setPathTargetNode(e.target.value)}>
                <option value="">Select Target Node…</option>
                {visNodes.filter(n => n.id !== selectedNode?.id).map(n => (
                  <option key={n.id} value={n.id}>{n.name || n.id}</option>
                ))}
              </select>
            )}
          </div>

          {/* Circular cycle spotlight picker */}
          {cycles.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--color-coral)', fontWeight: 600 }}>🔁 Circular Loops ({cycles.length}):</span>
              <select className="input" style={{ fontSize: 11, height: 24, width: 160, color: 'var(--color-coral)' }} value={activeCycleIndex} onChange={e => handleSpotlightCycle(Number(e.target.value))}>
                <option value="-1">Spotlight a cycle…</option>
                {cycles.map((c, idx) => (
                  <option key={idx} value={idx}>Cycle #{idx + 1} ({c.length} nodes)</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Graph Container */}
        <div className="graph-container" style={{ flex: 1, position: 'relative' }}>
          <div ref={cyRef} style={{ width: '100%', height: '100%' }} />
          <Legend currentScope={scope} />
        </div>

        {/* Bottom stats footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-on-surface-variant)' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="pill pill-neutral">{visNodes.length} {scope} rendered</span>
            <span className="pill pill-neutral">{visEdges.length} connections</span>
            {scope === 'files' && (
              <>
                <span className="pill pill-error">{visEdges.filter(e => e.isCircular).length} circular links</span>
                <span className="pill pill-warn">{visNodes.filter(n => n.isGodFile).length} god files</span>
              </>
            )}
          </div>

          {currentNodes.length > 150 && (
            <button className="btn btn-secondary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => setShowAll(s => !s)}>
              {showAll ? 'Show Top 150' : `Show All ${currentNodes.length} Nodes`}
            </button>
          )}
        </div>
      </div>

      {/* ── Node Inspector Panel ─────────────────────────────────── */}
      <div className="inspector-panel slide-in" style={{ width: 340, minWidth: 300, display: 'flex', flexDirection: 'column' }}>
        <div className="inspector-header">
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-on-surface)' }}>
            Component Inspector
          </span>
          {selectedNode && (
            <button className="btn btn-icon" style={{ height: 22, width: 22, marginLeft: 'auto' }} onClick={() => selectNode(null)} title="Clear selection">
              ✕
            </button>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          <NodeInspector key={selectedNode?.id || 'none'} node={selectedNode} allEdges={currentEdges} files={files} />
        </div>
      </div>

    </div>
  );
}
