/**
 * AnalysisResult — Encapsulates processed architecture information,
 * repository statistics, graph nodes, edges, complexity metrics,
 * cycles, hotspots, onboarding pathways, and errors.
 */
export class AnalysisResult {
  constructor({
    summary = {},
    nodes = [],
    edges = [],
    classNodes = [],
    classEdges = [],
    functionNodes = [],
    functionEdges = [],
    callEdges = [],
    circularCycles = [],
    hotspots = [],
    onboarding = {},
    symbols = [],
    functionCalls = [],
    errors = [],
    repository = null
  } = {}) {
    this.summary = summary;
    this.nodes = nodes;
    this.edges = edges;
    this.classNodes = classNodes;
    this.classEdges = classEdges;
    this.functionNodes = functionNodes;
    this.functionEdges = functionEdges;
    this.callEdges = callEdges;
    this.circularCycles = circularCycles;
    this.hotspots = hotspots;
    this.onboarding = onboarding;
    this.symbols = symbols;
    this.functionCalls = functionCalls;
    this.errors = errors;
    this.repository = repository;
  }

  toJSON() {
    return {
      summary: this.summary,
      nodes: this.nodes,
      edges: this.edges,
      classNodes: this.classNodes,
      classEdges: this.classEdges,
      functionNodes: this.functionNodes,
      functionEdges: this.functionEdges,
      callEdges: this.callEdges,
      circularCycles: this.circularCycles,
      hotspots: this.hotspots,
      onboarding: this.onboarding,
      symbols: this.symbols,
      functionCalls: this.functionCalls,
      errors: this.errors,
      repository: this.repository
    };
  }
}

