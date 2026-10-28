/**
 * VisualizationService — Prepares, filters, and formats graph data
 * for interactive Cytoscape.js rendering on the frontend.
 * Implements level-of-detail (LOD) aggregation, filtering, and search indexes.
 */
export class VisualizationService {
  constructor(options = {}) {
    this.options = {
      defaultNodeLimit: 150,
      ...options
    };
  }

  /**
   * Format analysis result for Cytoscape.js rendering.
   * Supports view scopes: 'files', 'classes', 'functions', 'composite'.
   * @param {import("./AnalysisResult.js").AnalysisResult} analysisResult
   * @param {object} filterOptions
   */
  formatForCytoscape(analysisResult, filterOptions = {}) {
    const {
      scope = "files",
      limit = this.options.defaultNodeLimit,
      cluster = null,
      extension = null,
      search = null,
      onlyGodFiles = false,
      onlyCircular = false
    } = filterOptions;

    let rawNodes = [];
    let rawEdges = [];

    if (scope === "classes") {
      rawNodes = analysisResult.classNodes || [];
      rawEdges = analysisResult.classEdges || [];
    } else if (scope === "functions") {
      rawNodes = analysisResult.functionNodes || [];
      rawEdges = analysisResult.functionEdges || [];
    } else {
      // Default: file dependency graph
      rawNodes = analysisResult.nodes || [];
      rawEdges = analysisResult.edges || [];
    }

    // Apply filtering
    let filteredNodes = rawNodes;

    if (cluster) {
      filteredNodes = filteredNodes.filter((n) => n.cluster === cluster);
    }
    if (extension) {
      filteredNodes = filteredNodes.filter((n) => (n.extension || "").toLowerCase() === extension.toLowerCase());
    }
    if (onlyGodFiles) {
      filteredNodes = filteredNodes.filter((n) => n.isGodFile);
    }
    if (onlyCircular && analysisResult.circularCycles) {
      const cycleSet = new Set(analysisResult.circularCycles.flat());
      filteredNodes = filteredNodes.filter((n) => cycleSet.has(n.id));
    }
    if (search) {
      const q = search.toLowerCase();
      filteredNodes = filteredNodes.filter((n) =>
        (n.name || "").toLowerCase().includes(q) || (n.id || "").toLowerCase().includes(q)
      );
    }

    // Apply LOD aggregation / Limit for large codebases
    if (limit && filteredNodes.length > limit) {
      // Prioritize central / high-coupling nodes
      filteredNodes = [...filteredNodes]
        .sort((a, b) => ((b.inDegree || 0) + (b.outDegree || 0)) - ((a.inDegree || 0) + (a.outDegree || 0)))
        .slice(0, limit);
    }

    const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = rawEdges.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    );

    return {
      scope,
      totalAvailableNodes: rawNodes.length,
      renderedNodesCount: filteredNodes.length,
      renderedEdgesCount: filteredEdges.length,
      isAggregated: filteredNodes.length < rawNodes.length,
      elements: {
        nodes: filteredNodes.map((n) => ({
          data: {
            ...n,
            label: n.name || n.id
          }
        })),
        edges: filteredEdges.map((e) => ({
          data: {
            ...e,
            id: e.id || `${e.source}__${e.target}`
          }
        }))
      }
    };
  }

  /**
   * Find shortest path between two nodes (Dependency Path Tracing).
   * @param {Array<any>} edges
   * @param {string} startId
   * @param {string} endId
   */
  findDependencyPath(edges, startId, endId) {
    if (startId === endId) return [startId];

    const adj = new Map();
    for (const e of edges) {
      if (!adj.has(e.source)) adj.set(e.source, []);
      adj.get(e.source).push(e.target);
    }

    const queue = [[startId]];
    const visited = new Set([startId]);

    while (queue.length > 0) {
      const path = queue.shift();
      const curr = path[path.length - 1];

      for (const next of adj.get(curr) || []) {
        if (next === endId) {
          return [...path, next];
        }
        if (!visited.has(next)) {
          visited.add(next);
          queue.push([...path, next]);
        }
      }
    }

    return null; // No path found
  }
}

