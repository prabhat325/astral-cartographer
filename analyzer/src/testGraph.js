
import { scanFiles } from "./fileScanner.js";
import { analyzeImports } from "./importAnalyzer.js";
import { buildGraph } from "./graphBuilder.js";

const files = await scanFiles("./test-repo");
const importsByFile = {};

for (const file of files) {
  importsByFile[file.path] = analyzeImports(
    file.content,
    file.path
  );
}

const graph = buildGraph(files, importsByFile);

console.log(JSON.stringify(graph, null, 2));
