import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as d3 from 'd3';
import { useAnalysis } from '../context/AnalysisContext';

const EXT_COLORS = {
  '.js':  '#f59e0b',
  '.jsx': '#f97316',
  '.ts':  '#3b82f6',
  '.tsx': '#6366f1',
  '.py':  '#10b981',
  '.go':  '#06b6d4',
  '.rs':  '#ef4444',
  '.java':'#8b5cf6',
  '.cpp': '#ec4899',
  '.c':   '#14b8a6',
  '.h':   '#84cc16',
  '.php': '#a855f7',
};
function extColor(ext) { return EXT_COLORS[ext] || '#9ca3af'; }
function nodeRadius(n) {
  const base = 5 + Math.min(n.inDegree || 0, 10) * 1.5;
  return n.isGodFile ? base + 6 : base;
}

function Legend() {
  const exts = Object.entries(EXT_COLORS).slice(0, 8);
  return (
    <div className="graph-legend">
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        Legend
      </div>
      {exts.map(([ext, color]) => (
        <div className="legend-item" key={ext}>
          <div className="legend-dot" style={{ background: color }} />
          <span>{ext}</span>
        </div>
      ))}
      <div className="divider" style={{ margin: '4px 0' }} />
      <div className="legend-item">
        <svg width="30" height="10"><line x1="0" y1="5" x2="30" y2="5" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 2"/></svg>
        <span>Circular</span>
      </div>
    </div>
  );
}

export default function DependencyPage() {
  const { state, selectNode } = useAnalysis();
  const { result, selectedNode } = state;
  const svgRef  = useRef(null);
  const simRef  = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [nodeCount, setNodeCount] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const arch = result?.architecture;
  const allNodes = arch?.nodes ?? [];
  const allEdges = arch?.edges ?? [];

  // For large repos, limit to top 120 nodes by inDegree unless showAll
  const nodes = showAll ? allNodes : allNodes.slice().sort((a,b)=>(b.inDegree+b.outDegree)-(a.inDegree+a.outDegree)).slice(0,120);
  const nodeIds = new Set(nodes.map(n=>n.id));
  const edges = allEdges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

  const drawGraph = useCallback(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const container = svgRef.current.parentElement;
    const W = container.clientWidth;
    const H = container.clientHeight;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', W).attr('height', H);

    // Defs: arrowheads
    const defs = svg.append('defs');
    defs.append('marker').attr('id','arrow').attr('viewBox','0 -5 10 10').attr('refX',14).attr('refY',0)
      .attr('markerWidth',6).attr('markerHeight',6).attr('orient','auto')
      .append('path').attr('d','M0,-5L10,0L0,5').attr('fill','#c5c5d3');
    defs.append('marker').attr('id','arrow-circular').attr('viewBox','0 -5 10 10').attr('refX',14).attr('refY',0)
      .attr('markerWidth',6).attr('markerHeight',6).attr('orient','auto')
      .append('path').attr('d','M0,-5L10,0L0,5').attr('fill','#ef4444');

    const g = svg.append('g');

    // Zoom behavior
    const zoomBehavior = d3.zoom().scaleExtent([0.1, 4]).on('zoom', (event) => {
      g.attr('transform', event.transform);
      setZoom(Math.round(event.transform.k * 100));
    });
    svg.call(zoomBehavior);

    // Simulation
    const simNodes = nodes.map(n => ({ ...n }));
    const simEdges = edges.map(e => ({ ...e, source: e.source, target: e.target }));

    const sim = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink(simEdges).id(d => d.id).distance(60).strength(0.4))
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide().radius(d => nodeRadius(d) + 4));

    simRef.current = sim;

    // Edges
    const link = g.append('g').selectAll('line').data(simEdges).enter().append('line')
      .attr('stroke', d => d.isCircular ? '#ef4444' : '#c5c5d3')
      .attr('stroke-width', d => d.isCircular ? 1.5 : 0.8)
      .attr('stroke-dasharray', d => d.isCircular ? '4 2' : null)
      .attr('marker-end', d => `url(#arrow${d.isCircular ? '-circular' : ''})`)
      .attr('opacity', 0.7);

    // Nodes
    const node = g.append('g').selectAll('circle').data(simNodes).enter().append('circle')
      .attr('r', d => nodeRadius(d))
      .attr('fill', d => extColor(d.extension))
      .attr('stroke', d => d.isGodFile ? '#f59e0b' : 'rgba(255,255,255,0.4)')
      .attr('stroke-width', d => d.isGodFile ? 2.5 : 1)
      .attr('opacity', 0.88)
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag',  (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end',   (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      )
      .on('click', (event, d) => { event.stopPropagation(); selectNode(d); });

    // Labels (only for high-degree nodes to avoid clutter)
    const label = g.append('g').selectAll('text')
      .data(simNodes.filter(n => (n.inDegree + n.outDegree) > 3))
      .enter().append('text')
      .text(d => d.name)
      .attr('font-size', 9).attr('font-family', 'JetBrains Mono, monospace')
      .attr('fill', '#454652').attr('text-anchor', 'middle')
      .attr('pointer-events', 'none');

    // Highlight selected
    svg.on('click', () => selectNode(null));

    sim.on('tick', () => {
      link
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('cx', d => d.x).attr('cy', d => d.y);
      label.attr('x', d => d.x).attr('y', d => d.y - nodeRadius(d) - 3);
    });

    setNodeCount(simNodes.length);
  }, [nodes, edges, selectNode]);

  useEffect(() => { drawGraph(); return () => { simRef.current?.stop(); }; }, [drawGraph]);

  // Highlight selected node
  useEffect(() => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).selectAll('circle')
      .attr('stroke', d => selectedNode?.id === d.id ? 'var(--color-primary)' : d.isGodFile ? '#f59e0b' : 'rgba(255,255,255,0.4)')
      .attr('stroke-width', d => selectedNode?.id === d.id ? 2.5 : d.isGodFile ? 2.5 : 1);
  }, [selectedNode]);

  if (!result) return null;

  return (
    <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 64px - 48px)', minHeight: 500, maxWidth: 1400, margin: '0 auto', width: '100%' }}>
      {/* Main graph pane */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div className="section-eyebrow">Dependency Explorer</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-on-surface)' }}>
              {nodeCount} nodes · {edges.length} edges
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {allNodes.length > 120 && (
              <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={() => setShowAll(s => !s)}>
                {showAll ? `Show Top 120` : `Show All ${allNodes.length}`}
              </button>
            )}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-outline)' }}>
              Zoom: {zoom}%
            </span>
          </div>
        </div>

        <div className="graph-container" style={{ flex: 1 }}>
          <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
          <div className="graph-toolbar">
            <button className="btn btn-icon" title="Zoom in"  onClick={() => d3.select(svgRef.current).transition().call(d3.zoom().scaleBy, 1.3)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
            <button className="btn btn-icon" title="Reset view" onClick={() => {
              d3.select(svgRef.current).transition().call(d3.zoom().transform, d3.zoomIdentity);
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
            </button>
          </div>
          <Legend />
        </div>

        {/* Edge count pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className="pill pill-neutral">
            {edges.filter(e => !e.isCircular).length} normal edges
          </span>
          <span className="pill pill-error">
            {edges.filter(e => e.isCircular).length} circular edges
          </span>
          <span className="pill pill-warn">
            {allNodes.filter(n => n.isGodFile).length} god files
          </span>
        </div>
      </div>

      {/* Node Inspector */}
      <div className="inspector-panel slide-in">
        <div className="inspector-header">
          {selectedNode ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: extColor(selectedNode.extension), flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedNode.name}
              </span>
            </div>
          ) : (
            <span style={{ color: 'var(--color-on-surface-variant)', fontWeight: 400, fontSize: 12 }}>
              Click a node to inspect
            </span>
          )}
        </div>

        {selectedNode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="inspector-row">
              <span className="inspector-key">Path</span>
              <span className="inspector-val" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 11 }}>{selectedNode.id}</span>
            </div>
            <div className="inspector-row"><span className="inspector-key">Extension</span><span className="inspector-val">{selectedNode.extension}</span></div>
            <div className="inspector-row"><span className="inspector-key">Cluster</span><span className="inspector-val">{selectedNode.cluster || '—'}</span></div>
            <div className="inspector-row"><span className="inspector-key">In-degree</span><span className="inspector-val">{selectedNode.inDegree}</span></div>
            <div className="inspector-row"><span className="inspector-key">Out-degree</span><span className="inspector-val">{selectedNode.outDegree}</span></div>
            <div className="inspector-row"><span className="inspector-key">Complexity</span><span className="inspector-val">{selectedNode.complexity}</span></div>
            <div className="inspector-row"><span className="inspector-key">LOC</span><span className="inspector-val">{selectedNode.loc?.code ?? selectedNode.loc?.total ?? '—'}</span></div>
            <div className="inspector-row"><span className="inspector-key">Tokens</span><span className="inspector-val">{selectedNode.tokenCount}</span></div>
            <div className="inspector-row">
              <span className="inspector-key">Blast radius</span>
              <span className="inspector-val">{selectedNode.blastRadius?.affectedCount ?? '—'} files</span>
            </div>
            {selectedNode.isGodFile && (
              <div className="alert alert-warn" style={{ marginTop: 8, fontSize: 12 }}>
                ⚠️ God File — high coupling detected
              </div>
            )}

            {/* Dependencies out */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                Dependencies ({selectedNode.outDegree})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 160, overflowY: 'auto' }}>
                {allEdges.filter(e => (e.source === selectedNode.id || e.source?.id === selectedNode.id)).map((e, i) => (
                  <div key={i} style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11, padding: '3px 6px', borderRadius: 4,
                    background: 'var(--color-surface-container-low)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    color: e.isCircular ? 'var(--color-coral)' : 'var(--color-on-surface)',
                  }}>
                    → {typeof e.target === 'object' ? e.target.id : e.target}
                  </div>
                ))}
              </div>
            </div>

            {/* Imported by */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                Imported by ({selectedNode.inDegree})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 120, overflowY: 'auto' }}>
                {allEdges.filter(e => (e.target === selectedNode.id || e.target?.id === selectedNode.id)).map((e, i) => (
                  <div key={i} style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11, padding: '3px 6px', borderRadius: 4,
                    background: 'var(--color-surface-container-low)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    ← {typeof e.source === 'object' ? e.source.id : e.source}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="empty-state-icon">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <div className="empty-state-text">Click any node in the graph to inspect its dependencies, metrics, and connections</div>
          </div>
        )}
      </div>
    </div>
  );
}
