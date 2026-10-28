import { scanFiles } from "./fileScanner.js";
import { CodeParser } from "./CodeParser.js";
import { ASTAnalyzer } from "./ASTAnalyzer.js";
import { DependencyAnalyzer } from "./DependencyAnalyzer.js";
import { GraphBuilder } from "./GraphBuilder.js";
import { AnalysisResult } from "./AnalysisResult.js";
import { VisualizationService } from "./VisualizationService.js";
import { ArchitecturalAIExpert } from "./ArchitecturalAIExpert.js";

export {
  CodeParser,
  ASTAnalyzer,
  DependencyAnalyzer,
  GraphBuilder,
  AnalysisResult,
  VisualizationService,
  ArchitecturalAIExpert
};

/**
 * Core analysis engine that processes a collection of files.
 * Supports multi-language AST parsing (JS, TS, Python, Java, Go, C/C++, Rust, PHP).
 * @param {Array<{path: string, content: string}>} files
 * @returns {AnalysisResult}
 */
export function analyzeFiles(files) {
  const astAnalyzer = new ASTAnalyzer();
  const graphBuilder = new GraphBuilder();

  const importsByFile = {};
  const symbols = [];
  const functionCalls = [];
  const fileMetrics = {};
  const errors = [];

  for (const file of files) {
    try {
      const fileAnalysis = astAnalyzer.analyzeFile(file.content, file.path);

      importsByFile[file.path] = fileAnalysis.imports;
      symbols.push(...fileAnalysis.symbols);
      functionCalls.push(...fileAnalysis.functionCalls);

      fileMetrics[file.path] = {
        loc: fileAnalysis.loc,
        tokenCount: fileAnalysis.tokenCount,
        complexity: fileAnalysis.complexity,
        functionComplexities: fileAnalysis.functionComplexities
      };

      if (fileAnalysis.error) {
        errors.push({
          file: file.path,
          message: fileAnalysis.error
        });
      }
    } catch (error) {
      importsByFile[file.path] = [];
      fileMetrics[file.path] = {
        loc: { total: 0, code: 0, comment: 0, blank: 0 },
        tokenCount: 0,
        complexity: 1,
        functionComplexities: []
      };

      errors.push({
        file: file.path,
        message: error.message
      });
    }
  }

  // Build Graph (Files, Classes, Functions, Cycles, Hotspots, Onboarding, Health)
  const graph = graphBuilder.build(files, importsByFile, symbols, functionCalls, fileMetrics);

  const totalClasses = graph.classNodes.length;
  const totalFunctions = graph.functionNodes.length;

  const result = new AnalysisResult({
    summary: {
      totalFiles: files.length,
      totalEdges: graph.edges.length,
      totalSymbols: symbols.length,
      totalClasses,
      totalFunctions,
      totalFunctionCalls: functionCalls.length,
      circularCyclesCount: graph.circularCycles.length,
      godFilesCount: graph.godFilesCount,
      healthScore: graph.healthScore,
      avgComplexity: graph.avgComplexity,
      totalErrors: errors.length
    },
    nodes: graph.nodes,
    edges: graph.edges,
    classNodes: graph.classNodes,
    classEdges: graph.classEdges,
    functionNodes: graph.functionNodes,
    functionEdges: graph.functionEdges,
    callEdges: graph.callEdges,
    circularCycles: graph.circularCycles,
    hotspots: graph.hotspots,
    onboarding: graph.onboarding,
    symbols,
    functionCalls,
    errors
  });

  return result.toJSON();
}

/**
 * Analyzes a repository folder from disk.
 * @param {string} repoPath
 */
export async function analyzeRepository(repoPath) {
  const files = await scanFiles(repoPath);
  return analyzeFiles(files);
}
