import { scanFiles } from "./fileScanner.js";
import { analyzeImports } from "./importAnalyzer.js";
import { analyzeSymbols } from "./symbolAnalyzer.js";
import { analyzeFunctionCalls } from "./functionAnalyzer.js";
import {
  calculateLoc,
  estimateTokens,
  calculateCyclomaticComplexity
} from "./metricsAnalyzer.js";
import { buildGraph } from "./graphBuilder.js";

/**
 * Core analysis engine that processes a collection of files.
 * @param {Array<{path: string, content: string}>} files
 */
export async function analyzeFiles(files) {
  const importsByFile = {};
  const symbols = [];
  const functionCalls = [];
  const fileMetrics = {};
  const errors = [];

  for (const file of files) {
    try {
      // 1. Code Metrics: LOC, Tokens, Cyclomatic Complexity
      const loc = calculateLoc(file.content);
      const tokenCount = estimateTokens(file.content);
      const { fileComplexity, functionComplexities } = calculateCyclomaticComplexity(
        file.content,
        file.path
      );

      fileMetrics[file.path] = {
        loc,
        tokenCount,
        complexity: fileComplexity,
        functionComplexities
      };

      // 2. Import & Dependency Analysis
      importsByFile[file.path] = analyzeImports(file.content, file.path);

      // 3. Symbol Extraction (Functions, Classes, Methods, Types)
      const fileSymbols = analyzeSymbols(file.content, file.path);
      // Enrich symbols with their function complexity if available
      for (const sym of fileSymbols) {
        const matched = functionComplexities.find((fc) => fc.name === sym.name);
        if (matched) {
          sym.complexity = matched.complexity;
        }
      }
      symbols.push(...fileSymbols);

      // 4. Function Call Graph
      functionCalls.push(...analyzeFunctionCalls(file.content, file.path));
    } catch (error) {
      importsByFile[file.path] = [];
      fileMetrics[file.path] = {
        loc: calculateLoc(file.content),
        tokenCount: estimateTokens(file.content),
        complexity: 1,
        functionComplexities: []
      };

      errors.push({
        file: file.path,
        message: error.message
      });
    }
  }

  // 5. Build Graph & Compute Architectural Intelligence
  const {
    nodes,
    edges,
    callEdges,
    circularCycles,
    hotspots,
    onboarding,
    healthScore
  } = buildGraph(files, importsByFile, functionCalls, fileMetrics);

  return {
    summary: {
      totalFiles: files.length,
      totalEdges: edges.length,
      totalSymbols: symbols.length,
      totalFunctionCalls: functionCalls.length,
      circularCyclesCount: circularCycles.length,
      godFilesCount: nodes.filter((n) => n.isGodFile).length,
      healthScore,
      totalErrors: errors.length
    },
    nodes,
    edges,
    callEdges,
    circularCycles,
    hotspots,
    onboarding,
    symbols,
    functionCalls,
    errors
  };
}

/**
 * Analyzes a repository folder from disk.
 * @param {string} repoPath
 */
export async function analyzeRepository(repoPath) {
  const files = await scanFiles(repoPath);
  return analyzeFiles(files);
}
