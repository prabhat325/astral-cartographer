
import { scanFiles } from "./fileScanner.js";
import { analyzeImports } from "./importAnalyzer.js";
import { analyzeSymbols } from "./symbolAnalyzer.js";
import { buildGraph } from "./graphBuilder.js";

export async function analyzeRepository(repoPath) {
  const files = await scanFiles(repoPath);

  const importsByFile = {};
  const symbols = [];
  const errors = [];

  for (const file of files) {
    try {
      importsByFile[file.path] = analyzeImports(
        file.content,
        file.path
      );

      symbols.push(
        ...analyzeSymbols(file.content, file.path)
      );
    } catch (error) {
      importsByFile[file.path] = [];

      errors.push({
        file: file.path,
        message: error.message
      });
    }
  }

  const { nodes, edges } = buildGraph(files, importsByFile);

  return {
    summary: {
      totalFiles: files.length,
      totalEdges: edges.length,
      totalSymbols: symbols.length,
      totalErrors: errors.length
    },
    nodes,
    edges,
    symbols,
    errors
  };
}

