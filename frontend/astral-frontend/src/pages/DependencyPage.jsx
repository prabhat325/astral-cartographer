import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useAnalysis } from '../context/AnalysisContext';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Network, 
  Layers, 
  Search, 
  Flame, 
  X,
  FileCode2
} from 'lucide-react';

const CLUSTER_COLORS = {
  core:    '#D4AF70', // Champagne Gold
  ui:      '#E8B7C1', // Blush Pink
  module:  '#A98245', // Antique Gold
  service: '#C98598', // Dusty Rose
  util:    '#7D5265', // Burgundy Rose
  config:  '#8E8D99', // Slate
  default: '#B5945B',
};

function getClusterColor(cluster, ext) {
  if (cluster && CLUSTER_COLORS[cluster]) return CLUSTER_COLORS[cluster];
  if (ext === '.jsx' || ext === '.tsx') return CLUSTER_COLORS.ui;
  if (ext === '.js' || ext === '.ts') return CLUSTER_COLORS.module;
  return CLUSTER_COLORS.default;
}

function nodeRadius(n) {
  const base = 7 + Math.min(n.inDegree || 0, 12) * 1.6;
  return n.isGodFile ? base + 6 : base;
}

/* ── Royal Legend ── */
function RoyalLegend({ isCallGraph }) {
  return (
    <div className="graph-legend fade-in">
      <div style={{
        fontSize: 10.5,
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        color: 'var(--color-antique-gold)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 6
      }}>
        {isCallGraph ? 'Call Graph Nodes' : 'Module Legend'}
      </div>

      {!isCallGraph ? (
        <>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: CLUSTER_COLORS.core }} />
            <span>Core / Entry Module</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: CLUSTER_COLORS.ui }} />
            <span>UI & View Components</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: CLUSTER_COLORS.module }} />
            <span>Engines & Logic Modules</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: CLUSTER_COLORS.service }} />
            <span>Service & Integration</span>
          </div>
          <div style={{ height: 1, background: 'rgba(212, 175, 112, 0.25)', margin: '4px 0' }} />
          <div className="legend-item">
            <svg width="24" height="8">
              <line x1="0" y1="4" x2="24" y2="4" stroke="#B93855" strokeWidth="2" strokeDasharray="3 2" />
            </svg>
            <span style={{ color: 'var(--status-rose)', fontWeight: 600 }}>Circular Loop</span>
          </div>
        </>
      ) : (
        <>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'var(--color-antique-gold)' }} />
            <span>Function Caller</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'var(--color-dusty-rose)' }} />
            <span>Invoked Callee</span>
          </div>
          <div className="legend-item">
            <svg width="24" height="8">
              <line x1="0" y1="4" x2="24" y2="4" stroke="#D4AF70" strokeWidth="1.5" />
            </svg>
            <span>AST Call Edge</span>
          </div>
        </>
      )}
    </div>
  );
}

export default function DependencyPage() {
  const { state, selectNode, setGraphMode, navigateToCodeExplorer } = useAnalysis();
  const { result, selectedNode, graphMode = 'modules', activeView } = state;

  const svgRef = useRef(null);
  const simRef = useRef(null);

  const [zoom, setZoom] = useState(100);
  const [filterText, setFilterText] = useState('');
  const [showAll, setShowAll] = useState(false);

  const isCallGraph = graphMode === 'calls' || activeView === 'callGraph';

  const arch = result?.architecture;
  const allNodes = arch?.nodes ?? [];
  const allEdges = arch?.edges ?? [];
  const callEdges = arch?.callEdges ?? [];

  // Synthesize nodes & edges based on active graph mode
  const { graphNodes, graphEdges } = useMemo(() => {
    if (!isCallGraph) {
      // Module Dependency Graph
      let nList = allNodes;
      if (!showAll && nList.length > 120) {
        nList = [...nList].sort((a, b) => ((b.inDegree || 0) + (b.outDegree || 0)) - ((a.inDegree || 0) + (a.outDegree || 0))).slice(0, 120);
      }
      const idSet = new Set(nList.map(n => n.id));
      const eList = allEdges.filter(e => {
        const s = typeof e.source === 'object' ? e.source.id : e.source;
        const t = typeof e.target === 'object' ? e.target.id : e.target;
        return idSet.has(s) && idSet.has(t);
      });
      return { graphNodes: nList, graphEdges: eList };
    } else {
      // AST Function Call Graph
      const callNodesMap = new Map();
      const callEdgesList = [];

      callEdges.forEach((ce) => {
        const srcId = ce.source;
        const tgtId = ce.target;

        if (!callNodesMap.has(srcId)) {
          callNodesMap.set(srcId, {
            id: srcId,
            name: srcId.includes('::') ? srcId.split('::')[1] : srcId,
            file: srcId.split('::')[0],
            type: 'caller',
            inDegree: 0,
            outDegree: 0,
            complexity: 2,
            cluster: 'module'
          });
        }
        if (!callNodesMap.has(tgtId)) {
          callNodesMap.set(tgtId, {
            id: tgtId,
            name: tgtId,
            file: 'callee',
            type: 'callee',
            inDegree: 0,
            outDegree: 0,
            complexity: 1,
            cluster: 'service'
          });
        }

        callNodesMap.get(srcId).outDegree += 1;
        callNodesMap.get(tgtId).inDegree += 1;

        callEdgesList.push({
          source: srcId,
          target: tgtId,
          isCircular: false,
          type: 'calls',
          line: ce.line
        });
      });

      return {
        graphNodes: Array.from(callNodesMap.values()),
        graphEdges: callEdgesList
      };
    }
  }, [isCallGraph, allNodes, allEdges, callEdges, showAll]);

  // Draw force-directed graph with D3
  const drawGraph = useCallback(() => {
    if (!svgRef.current || graphNodes.length === 0) return;

    const container = svgRef.current.parentElement;
    const W = container.clientWidth || 800;
    const H = container.clientHeight || 600;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', W)
      .attr('height', H);

    // Marker defs
    const defs = svg.append('defs');

    // Normal arrow
    defs.append('marker')
      .attr('id', 'arrow-gold')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 18)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#D4AF70');

    // Circular arrow
    defs.append('marker')
      .attr('id', 'arrow-circular')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 18)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#B93855');

    // Main graph group
    const g = svg.append('g').attr('class', 'graph-main');

    // Zoom setup
    const zoomBehavior = d3.zoom()
      .scaleExtent([0.15, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoom(Math.round(event.transform.k * 100));
      });

    svg.call(zoomBehavior);

    // Simulation nodes & edges
    const simNodes = graphNodes.map(n => ({ ...n }));
    const simEdges = graphEdges.map(e => ({
      ...e,
      source: typeof e.source === 'object' ? e.source.id : e.source,
      target: typeof e.target === 'object' ? e.target.id : e.target
    }));

    const simulation = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink(simEdges).id(d => d.id).distance(70).strength(0.45))
      .force('charge', d3.forceManyBody().strength(-160))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide().radius(d => nodeRadius(d) + 6));

    simRef.current = simulation;

    // Edge lines
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(simEdges)
      .enter()
      .append('line')
      .attr('stroke', d => d.isCircular ? '#B93855' : 'rgba(212, 175, 112, 0.65)')
      .attr('stroke-width', d => d.isCircular ? 2 : 1.2)
      .attr('stroke-dasharray', d => d.isCircular ? '4 3' : null)
      .attr('marker-end', d => `url(#arrow-${d.isCircular ? 'circular' : 'gold'})`)
      .attr('opacity', 0.85);

    // Node circles group
    const nodeG = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(simNodes)
      .enter()
      .append('g')
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      )
      .on('click', (event, d) => {
        event.stopPropagation();
        selectNode(d);
      });

    // Outer glow ring for selected or god files
    nodeG.append('circle')
      .attr('class', 'outer-ring')
      .attr('r', d => nodeRadius(d) + 4)
      .attr('fill', 'none')
      .attr('stroke', d => d.isGodFile ? '#D4AF70' : 'transparent')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', d => d.isGodFile ? '3 2' : null);

    // Primary circle
    nodeG.append('circle')
      .attr('class', 'main-circle')
      .attr('r', d => nodeRadius(d))
      .attr('fill', d => getClusterColor(d.cluster, d.extension))
      .attr('stroke', '#FFF9F5')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0px 2px 4px rgba(67, 40, 50, 0.15))');

    // Node Labels
    const labels = g.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(simNodes)
      .enter()
      .append('text')
      .text(d => d.name)
      .attr('font-size', 10.5)
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-weight', 600)
      .attr('fill', '#432832')
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'none')
      .style('text-shadow', '0 1px 3px rgba(255, 249, 245, 0.9)');

    // Background click clears selection
    svg.on('click', () => selectNode(null));

    // Simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      nodeG.attr('transform', d => `translate(${d.x},${d.y})`);

      labels
        .attr('x', d => d.x)
        .attr('y', d => d.y - nodeRadius(d) - 4);
    });
  }, [graphNodes, graphEdges, selectNode]);

  useEffect(() => {
    drawGraph();
    return () => {
      simRef.current?.stop();
    };
  }, [drawGraph]);

  // Highlight selected node dynamically
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    svg.selectAll('.main-circle')
      .attr('stroke', d => selectedNode?.id === d.id ? '#432832' : '#FFF9F5')
      .attr('stroke-width', d => selectedNode?.id === d.id ? 3.5 : 2);

    svg.selectAll('.outer-ring')
      .attr('stroke', d => selectedNode?.id === d.id ? '#D4AF70' : d.isGodFile ? '#D4AF70' : 'transparent')
      .attr('stroke-width', d => selectedNode?.id === d.id ? 3 : 2);
  }, [selectedNode]);

  // Filter highlight
  useEffect(() => {
    if (!svgRef.current) return;
    const q = filterText.toLowerCase().trim();
    const svg = d3.select(svgRef.current);

    if (!q) {
      svg.selectAll('.nodes g').attr('opacity', 1);
      svg.selectAll('.links line').attr('opacity', 0.85);
      return;
    }

    svg.selectAll('.nodes g').attr('opacity', (d) =>
      d.id.toLowerCase().includes(q) || d.name.toLowerCase().includes(q) ? 1 : 0.2
    );
    svg.selectAll('.links line').attr('opacity', 0.15);
  }, [filterText]);

  if (!result) return null;

  return (
    <div style={{
      display: 'flex',
      gap: 20,
      height: 'calc(100vh - 68px - 48px)',
      minHeight: 560,
      maxWidth: 1480,
      margin: '0 auto',
      width: '100%'
    }}>
      {/* Main Canvas Column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        {/* Top Control Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            <div className="section-eyebrow">
              <Network size={12} color="var(--color-antique-gold)" />
              <span>Interactive Topological Cartographer</span>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--color-deep-burgundy)'
            }}>
              {graphNodes.length} Nodes · {graphEdges.length} Directed Edges
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Mode Toggle Bar: Module Graph vs Function Call Graph */}
            <div className="tab-bar" style={{ width: 'auto' }}>
              <button
                className={`tab-item${!isCallGraph ? ' active' : ''}`}
                onClick={() => setGraphMode('modules')}
              >
                <Network size={14} />
                <span>Module Imports</span>
              </button>
              <button
                className={`tab-item${isCallGraph ? ' active' : ''}`}
                onClick={() => setGraphMode('calls')}
              >
                <Layers size={14} />
                <span>Function Calls</span>
              </button>
            </div>

            {/* Search Filter */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--color-pearl-white)',
              border: '1px solid var(--border-gold-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0 10px',
              gap: 6
            }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Find node…"
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  padding: '7px 0',
                  fontSize: 12.5,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-deep-burgundy)',
                  width: 110
                }}
              />
              {filterText && (
                <button
                  type="button"
                  onClick={() => setFilterText('')}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2 }}
                >
                  <X size={12} color="var(--text-muted)" />
                </button>
              )}
            </div>

            {/* Toggle show all for large codebases */}
            {!isCallGraph && allNodes.length > 120 && (
              <button
                className="btn btn-royal"
                style={{ fontSize: 12, padding: '7px 14px' }}
                onClick={() => setShowAll(s => !s)}
              >
                {showAll ? 'Show Top 120' : `Show All ${allNodes.length}`}
              </button>
            )}

            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11.5,
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-warm-ivory)',
              border: '1px solid var(--border-gold-subtle)',
              color: 'var(--color-antique-gold)'
            }}>
              Zoom: {zoom}%
            </div>
          </div>
        </div>

        {/* D3 Graph Viewport */}
        <div className="graph-container" style={{ flex: 1 }}>
          <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />

          {/* Canvas Floating Toolbar */}
          <div className="graph-toolbar">
            <button
              className="btn-icon"
              title="Zoom In"
              onClick={() => d3.select(svgRef.current).transition().call(d3.zoom().scaleBy, 1.3)}
            >
              <ZoomIn size={15} />
            </button>
            <button
              className="btn-icon"
              title="Zoom Out"
              onClick={() => d3.select(svgRef.current).transition().call(d3.zoom().scaleBy, 0.75)}
            >
              <ZoomOut size={15} />
            </button>
            <button
              className="btn-icon"
              title="Reset View"
              onClick={() => {
                d3.select(svgRef.current).transition().call(d3.zoom().transform, d3.zoomIdentity);
              }}
            >
              <RotateCcw size={15} />
            </button>
          </div>

          <RoyalLegend isCallGraph={isCallGraph} />
        </div>

        {/* Bottom Metrics Pill Strip */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span className="pill pill-gold">
            {graphEdges.filter(e => !e.isCircular).length} Standard Dependencies
          </span>
          <span className="pill pill-error">
            {graphEdges.filter(e => e.isCircular).length} Circular Loops
          </span>
          <span className="pill pill-rose">
            {allNodes.filter(n => n.isGodFile).length} Architectural Hotspots
          </span>
        </div>
      </div>

      {/* Node Inspector Drawer */}
      <div className="inspector-panel slide-in">
        <div className="inspector-header">
          {selectedNode ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: getClusterColor(selectedNode.cluster, selectedNode.extension),
                boxShadow: '0 0 6px var(--color-champagne-gold)',
                flexShrink: 0
              }} />
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--color-deep-burgundy)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {selectedNode.name}
              </span>
            </div>
          ) : (
            <span>Inspect Module Attributes</span>
          )}

          {selectedNode && (
            <button
              type="button"
              className="btn-ghost"
              style={{ padding: 4 }}
              onClick={() => selectNode(null)}
              title="Close inspection"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {selectedNode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="inspector-row">
              <span className="inspector-key">Module Path</span>
              <span className="inspector-val" style={{ maxWidth: 210, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedNode.id}
              </span>
            </div>
            {selectedNode.extension && (
              <div className="inspector-row">
                <span className="inspector-key">Extension</span>
                <span className="inspector-val">{selectedNode.extension}</span>
              </div>
            )}
            <div className="inspector-row">
              <span className="inspector-key">Architectural Cluster</span>
              <span className="inspector-val" style={{ textTransform: 'capitalize' }}>
                {selectedNode.cluster || 'Module'}
              </span>
            </div>
            <div className="inspector-row">
              <span className="inspector-key">Cyclomatic Complexity</span>
              <span className="inspector-val" style={{ color: selectedNode.complexity > 10 ? 'var(--status-rose)' : 'inherit' }}>
                {selectedNode.complexity ?? 1}
              </span>
            </div>
            <div className="inspector-row">
              <span className="inspector-key">Lines of Code</span>
              <span className="inspector-val">{selectedNode.loc?.code ?? selectedNode.loc?.total ?? '—'}</span>
            </div>
            <div className="inspector-row">
              <span className="inspector-key">Afferent Coupling (In)</span>
              <span className="inspector-val">{selectedNode.inDegree ?? 0}</span>
            </div>
            <div className="inspector-row">
              <span className="inspector-key">Efferent Coupling (Out)</span>
              <span className="inspector-val">{selectedNode.outDegree ?? 0}</span>
            </div>
            {selectedNode.blastRadius && (
              <div className="inspector-row">
                <span className="inspector-key">Transitive Blast Radius</span>
                <span className="inspector-val">{selectedNode.blastRadius.affectedCount ?? 0} files ({Math.round((selectedNode.blastRadius.ratio || 0) * 100)}%)</span>
              </div>
            )}

            {selectedNode.isGodFile && (
              <div className="alert alert-error" style={{ marginTop: 8, fontSize: 12 }}>
                <Flame size={15} style={{ flexShrink: 0 }} />
                <span>God File alert: High inward coupling combined with elevated complexity.</span>
              </div>
            )}

            {/* Dependencies (Imports out) */}
            <div style={{ marginTop: 14 }}>
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--color-antique-gold)',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)',
                marginBottom: 6
              }}>
                Outgoing Dependencies ({selectedNode.outDegree ?? 0})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 150, overflowY: 'auto' }}>
                {allEdges
                  .filter(e => (typeof e.source === 'object' ? e.source.id : e.source) === selectedNode.id)
                  .map((e, i) => {
                    const targetId = typeof e.target === 'object' ? e.target.id : e.target;
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          const targetNode = allNodes.find(n => n.id === targetId);
                          if (targetNode) selectNode(targetNode);
                        }}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11.5,
                          padding: '5px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--color-warm-ivory)',
                          border: '1px solid var(--border-gold-subtle)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          color: e.isCircular ? 'var(--status-rose)' : 'var(--color-deep-burgundy)'
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          → {targetId}
                        </span>
                        {e.isCircular && <span className="pill pill-error" style={{ height: 16, fontSize: 9 }}>cycle</span>}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Imported by (Inward) */}
            <div style={{ marginTop: 10 }}>
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--color-deep-burgundy)',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)',
                marginBottom: 6
              }}>
                Imported By ({selectedNode.inDegree ?? 0})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
                {allEdges
                  .filter(e => (typeof e.target === 'object' ? e.target.id : e.target) === selectedNode.id)
                  .map((e, i) => {
                    const sourceId = typeof e.source === 'object' ? e.source.id : e.source;
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          const sourceNode = allNodes.find(n => n.id === sourceId);
                          if (sourceNode) selectNode(sourceNode);
                        }}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11.5,
                          padding: '5px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--color-warm-ivory)',
                          border: '1px solid var(--border-gold-subtle)',
                          cursor: 'pointer',
                          color: 'var(--color-deep-burgundy)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        ← {sourceId}
                      </div>
                    );
                  })}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-royal"
              style={{ marginTop: 14, width: '100%', fontSize: 12.5 }}
              onClick={() => navigateToCodeExplorer(selectedNode.file || selectedNode.id || selectedNode.name)}
            >
              <FileCode2 size={14} color="var(--color-antique-gold)" />
              <span>Open in Code Explorer</span>
            </button>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '50px 20px',
            textAlign: 'center',
            gap: 12
          }}>
            <Network size={36} color="var(--border-gold-solid)" style={{ opacity: 0.6 }} />
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-deep-burgundy)' }}>
              Click Any Node to Inspect
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Select a node in the graph canvas to inspect its afferent/efferent connections, cyclomatic debt, and blast radius.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
