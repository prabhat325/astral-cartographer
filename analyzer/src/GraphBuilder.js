import path from "node:path";
import { DependencyAnalyzer } from "./DependencyAnalyzer.js";

/**
 * GraphBuilder — Converts dependencies and structural component relationships
 * into graph nodes and edges across files, classes, and functions.
 */
export class GraphBuilder {
  constructor() {
    this.dependencyAnalyzer = new DependencyAnalyzer();
  }

  /**
   * Build complete multi-scope architecture graph.
   * @param {Array<{path: string, content: string}>} files
   * @param {Record<string, Array<any>>} importsByFile
   * @param {Array<any>} symbols
   * @param {Array<any>} functionCalls
   * @param {Record<string, any>} fileMetrics
   */
  build(files, importsByFile, symbols = [], functionCalls = [], fileMetrics = {}) {
    // 1. File-level graph from DependencyAnalyzer
    const fileAnalysis = this.dependencyAnalyzer.analyze(files, importsByFile, fileMetrics);

    // 2. Class & Struct level graph
    const classNodes = [];
    const classEdges = [];
    const classSymbols = symbols.filter((s) => s.type === "class" || s.type === "interface" || s.type === "struct");
    const classNamesSet = new Set(classSymbols.map((c) => c.name));

    for (const cls of classSymbols) {
      classNodes.push({
        id: `class::${cls.file}::${cls.name}`,
        name: cls.name,
        type: "class",
        file: cls.file,
        line: cls.line,
        superClass: cls.superClass || null,
        cluster: "class",
        complexity: cls.complexity || 1
      });

      if (cls.superClass && classNamesSet.has(cls.superClass)) {
        const targetCls = classSymbols.find((c) => c.name === cls.superClass);
        if (targetCls) {
          classEdges.push({
            id: `class_edge::${cls.name}__${cls.superClass}`,
            source: `class::${cls.file}::${cls.name}`,
            target: `class::${targetCls.file}::${targetCls.name}`,
            type: "inherits"
          });
        }
      }
    }

    // 3. Function & Call graph
    const functionNodes = [];
    const funcSymbols = symbols.filter((s) => s.type === "function" || s.type === "method" || s.type === "arrow");
    for (const fn of funcSymbols) {
      functionNodes.push({
        id: `fn::${fn.file}::${fn.name}`,
        name: fn.name,
        type: "function",
        file: fn.file,
        line: fn.line,
        className: fn.className || null,
        complexity: fn.complexity || 1,
        paramsCount: fn.paramsCount || 0
      });
    }

    const callEdges = functionCalls.map((call, idx) => {
      // Find matching function node if any
      const targetFn = funcSymbols.find((s) => s.name === call.callee);
      const targetId = targetFn ? `fn::${targetFn.file}::${targetFn.name}` : `fn::external::${call.callee}`;
      return {
        id: `call_${idx}::${call.caller}->${call.callee}`,
        source: `fn::${call.file}::${call.caller}`,
        target: targetId,
        type: "calls",
        line: call.line,
        calleeName: call.callee
      };
    });

    return {
      nodes: fileAnalysis.nodes,
      edges: fileAnalysis.edges,
      classNodes,
      classEdges,
      functionNodes,
      functionEdges: callEdges,
      callEdges,
      circularCycles: fileAnalysis.circularCycles,
      hotspots: fileAnalysis.hotspots,
      onboarding: fileAnalysis.onboarding,
      healthScore: fileAnalysis.healthScore,
      avgComplexity: fileAnalysis.avgComplexity,
      godFilesCount: fileAnalysis.godFilesCount
    };
  }
}
