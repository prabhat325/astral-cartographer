
import { scanFiles } from "./fileScanner.js";
import { analyzeImports } from "./importAnalyzer.js";
import { analyzeSymbols } from "./symbolAnalyzer.js";
import { analyzeFunctionCalls } from "./functionAnalyzer.js";
import { buildGraph } from "./graphBuilder.js";

export async function analyzeRepository(repoPath) {
  // Step 1: Scan repository files
  const files = await scanFiles(repoPath);

  const importsByFile = {};
  const symbols = [];
  const functionCalls = [];
  const errors = [];

  // Step 2: Analyze each file
  for (const file of files) {
    try {
      importsByFile[file.path] = analyzeImports(
        file.content,
        file.path
      );

      symbols.push(
        ...analyzeSymbols(file.content, file.path)
      );

      functionCalls.push(
        ...analyzeFunctionCalls(file.content, file.path)
      );
    } catch (error) {
      importsByFile[file.path] = [];

      errors.push({
        file: file.path,
        message: error.message
      });
    }
  }

  // Step 3: Build graph with imports and function calls
  const { nodes, edges } = buildGraph(
    files,
    importsByFile,
    functionCalls
  );

  // Step 4: Return complete analysis result
  return {
    summary: {
      totalFiles: files.length,
      totalEdges: edges.length,
      totalSymbols: symbols.length,
      totalFunctionCalls: functionCalls.length,
      totalErrors: errors.length
    },

    nodes,
    edges,
    symbols,
    functionCalls,
    errors
  };
}
