
import { readFile } from "node:fs/promises";
import { analyzeFunctionCalls } from "./functionAnalyzer.js";

const code = await readFile("./test-repo/App.jsx", "utf8");

const calls = analyzeFunctionCalls(code, "App.jsx");

console.log(JSON.stringify(calls, null, 2));
