

import { readFile } from "node:fs/promises";
import { analyzeImports } from "./importAnalyzer.js";

const code = await readFile(
  "./test-repo/App.jsx",
  "utf8"
);

const result = analyzeImports(code, "App.jsx");

console.log(JSON.stringify(result, null, 2));
