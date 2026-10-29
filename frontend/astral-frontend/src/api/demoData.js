/**
 * Authentic demo repository analysis and source files.
 * Derived directly from the analyzer's AST engine runs on test-repo.
 */
export const DEMO_ANALYSIS = {
  repository: {
    name: "astral-cartographer-core",
    fullName: "astral-cartographer/architecture-sample",
    description: "Royal reference architecture showcasing directional dependency cycles, AST call graphs, cyclomatic hotspots, and leaf onboarding points."
  },
  totalFiles: 7,
  files: [
    {
      path: "App.jsx",
      content: `import Graph from "./Graph.jsx";\nimport { formatData } from "./utils.js";\n\nexport function App() {\n  return Graph(formatData("hello"));\n}\n`
    },
    {
      path: "Badge.jsx",
      content: `export function Badge({ label, variant = "info" }) {\n  return \`<span class="badge \${variant}">\${label}</span>\`;\n}\n`
    },
    {
      path: "dataEngine.js",
      content: `import { formatData } from "./utils.js";\nimport { processA } from "./serviceA.js";\nimport { processB } from "./serviceB.js";\n\nexport function handleComplexDataPipeline(data, options = {}) {\n  let result = [];\n\n  if (!data || data.length === 0) {\n    return null;\n  }\n\n  for (const item of data) {\n    if (item.active && item.score > 50) {\n      if (options.normalize) {\n        result.push(processA(item.score));\n      } else if (options.legacy) {\n        result.push(processB(item.score));\n      } else {\n        result.push(formatData(item.title));\n      }\n    } else if (item.pending || item.retry) {\n      if (options.strict) {\n        throw new Error("Invalid item state");\n      }\n    } else {\n      switch (item.type) {\n        case "A":\n          result.push("TypeA");\n          break;\n        case "B":\n          result.push("TypeB");\n          break;\n        case "C":\n          result.push("TypeC");\n          break;\n        default:\n          result.push("Unknown");\n      }\n    }\n  }\n\n  return result;\n}\n`
    },
    {
      path: "Graph.jsx",
      content: `export default function Graph(data) {\n  return data;\n}\n`
    },
    {
      path: "serviceA.js",
      content: `import { processB } from "./serviceB.js";\n\nexport function processA(input) {\n  if (input > 10) {\n    return processB(input - 1);\n  }\n  return input * 2;\n}\n`
    },
    {
      path: "serviceB.js",
      content: `import { processA } from "./serviceA.js";\n\nexport function processB(input) {\n  if (input <= 0) {\n    return 0;\n  }\n  return processA(input - 2);\n}\n`
    },
    {
      path: "utils.js",
      content: `export function formatData(value) {\n  return value.trim();\n}\n\nexport class DataFormatter {}\n`
    }
  ],
  architecture: {
    summary: {
      totalFiles: 7,
      totalEdges: 7,
      totalSymbols: 8,
      totalFunctionCalls: 15,
      circularCyclesCount: 1,
      godFilesCount: 0,
      healthScore: 85,
      totalErrors: 0
    },
    nodes: [
      {
        id: "App.jsx",
        name: "App.jsx",
        type: "file",
        extension: ".jsx",
        cluster: "core",
        loc: { total: 6, code: 5, comment: 0, blank: 1 },
        tokenCount: 28,
        complexity: 1,
        inDegree: 0,
        outDegree: 2,
        blastRadius: { affectedFiles: [], affectedCount: 0, ratio: 0 },
        godFileScore: 2.1,
        riskLevel: "low",
        isGodFile: false
      },
      {
        id: "Badge.jsx",
        name: "Badge.jsx",
        type: "file",
        extension: ".jsx",
        cluster: "ui",
        loc: { total: 4, code: 3, comment: 0, blank: 1 },
        tokenCount: 17,
        complexity: 1,
        inDegree: 0,
        outDegree: 0,
        blastRadius: { affectedFiles: [], affectedCount: 0, ratio: 0 },
        godFileScore: 0.4,
        riskLevel: "low",
        isGodFile: false
      },
      {
        id: "dataEngine.js",
        name: "dataEngine.js",
        type: "file",
        extension: ".js",
        cluster: "module",
        loc: { total: 44, code: 39, comment: 0, blank: 5 },
        tokenCount: 222,
        complexity: 14,
        inDegree: 0,
        outDegree: 3,
        blastRadius: { affectedFiles: [], affectedCount: 0, ratio: 0 },
        godFileScore: 8.5,
        riskLevel: "high",
        isGodFile: false
      },
      {
        id: "Graph.jsx",
        name: "Graph.jsx",
        type: "file",
        extension: ".jsx",
        cluster: "ui",
        loc: { total: 3, code: 3, comment: 0, blank: 0 },
        tokenCount: 12,
        complexity: 1,
        inDegree: 1,
        outDegree: 0,
        blastRadius: { affectedFiles: ["App.jsx"], affectedCount: 1, ratio: 0.17 },
        godFileScore: 1.9,
        riskLevel: "low",
        isGodFile: false
      },
      {
        id: "serviceA.js",
        name: "serviceA.js",
        type: "file",
        extension: ".js",
        cluster: "module",
        loc: { total: 9, code: 7, comment: 0, blank: 2 },
        tokenCount: 36,
        complexity: 2,
        inDegree: 2,
        outDegree: 1,
        blastRadius: { affectedFiles: ["dataEngine.js", "serviceB.js"], affectedCount: 2, ratio: 0.33 },
        godFileScore: 4.7,
        riskLevel: "low",
        isGodFile: false
      },
      {
        id: "serviceB.js",
        name: "serviceB.js",
        type: "file",
        extension: ".js",
        cluster: "module",
        loc: { total: 9, code: 7, comment: 0, blank: 2 },
        tokenCount: 34,
        complexity: 2,
        inDegree: 2,
        outDegree: 1,
        blastRadius: { affectedFiles: ["dataEngine.js", "serviceA.js"], affectedCount: 2, ratio: 0.33 },
        godFileScore: 4.7,
        riskLevel: "low",
        isGodFile: false
      },
      {
        id: "utils.js",
        name: "utils.js",
        type: "file",
        extension: ".js",
        cluster: "module",
        loc: { total: 5, code: 4, comment: 0, blank: 1 },
        tokenCount: 20,
        complexity: 1,
        inDegree: 2,
        outDegree: 0,
        blastRadius: { affectedFiles: ["App.jsx", "dataEngine.js"], affectedCount: 2, ratio: 0.33 },
        godFileScore: 3.4,
        riskLevel: "low",
        isGodFile: false
      }
    ],
    edges: [
      { source: "App.jsx", target: "Graph.jsx", type: "import", line: 1, isDynamic: false, isCircular: false },
      { source: "App.jsx", target: "utils.js", type: "import", line: 2, isDynamic: false, isCircular: false },
      { source: "dataEngine.js", target: "utils.js", type: "import", line: 1, isDynamic: false, isCircular: false },
      { source: "dataEngine.js", target: "serviceA.js", type: "import", line: 2, isDynamic: false, isCircular: false },
      { source: "dataEngine.js", target: "serviceB.js", type: "import", line: 3, isDynamic: false, isCircular: false },
      { source: "serviceA.js", target: "serviceB.js", type: "import", line: 1, isDynamic: false, isCircular: true },
      { source: "serviceB.js", target: "serviceA.js", type: "import", line: 1, isDynamic: false, isCircular: true }
    ],
    callEdges: [
      { source: "App.jsx::App", target: "Graph", type: "calls", line: 5 },
      { source: "App.jsx::App", target: "formatData", type: "calls", line: 5 },
      { source: "dataEngine.js::handleComplexDataPipeline", target: "result.push", type: "calls", line: 15 },
      { source: "dataEngine.js::handleComplexDataPipeline", target: "processA", type: "calls", line: 15 },
      { source: "dataEngine.js::handleComplexDataPipeline", target: "result.push", type: "calls", line: 17 },
      { source: "dataEngine.js::handleComplexDataPipeline", target: "processB", type: "calls", line: 17 },
      { source: "dataEngine.js::handleComplexDataPipeline", target: "result.push", type: "calls", line: 19 },
      { source: "dataEngine.js::handleComplexDataPipeline", target: "formatData", type: "calls", line: 19 },
      { source: "dataEngine.js::handleComplexDataPipeline", target: "result.push", type: "calls", line: 28 },
      { source: "dataEngine.js::handleComplexDataPipeline", target: "result.push", type: "calls", line: 31 },
      { source: "dataEngine.js::handleComplexDataPipeline", target: "result.push", type: "calls", line: 34 },
      { source: "dataEngine.js::handleComplexDataPipeline", target: "result.push", type: "calls", line: 37 },
      { source: "serviceA.js::processA", target: "processB", type: "calls", line: 5 },
      { source: "serviceB.js::processB", target: "processA", type: "calls", line: 7 },
      { source: "utils.js::formatData", target: "value.trim", type: "calls", line: 2 }
    ],
    circularCycles: [
      ["serviceA.js", "serviceB.js", "serviceA.js"]
    ],
    hotspots: [
      {
        file: "dataEngine.js",
        score: 8.5,
        riskLevel: "high",
        complexity: 14,
        inDegree: 0,
        outDegree: 3,
        loc: 39,
        reason: "HIGH RISK: 0 dependants, 14 cyclomatic complexity, 39 LOC."
      }
    ],
    onboarding: {
      goodFirstIssues: [
        {
          file: "App.jsx",
          name: "App.jsx",
          complexity: 1,
          loc: 5,
          blastRatio: 0,
          recommendation: "Safe, isolated module ideal for newcomer PRs (minimal blast radius)."
        },
        {
          file: "Badge.jsx",
          name: "Badge.jsx",
          complexity: 1,
          loc: 3,
          blastRatio: 0,
          recommendation: "Safe, isolated module ideal for newcomer PRs (minimal blast radius)."
        },
        {
          file: "Graph.jsx",
          name: "Graph.jsx",
          complexity: 1,
          loc: 3,
          blastRatio: 0.17,
          recommendation: "Safe, isolated module ideal for newcomer PRs (minimal blast radius)."
        }
      ],
      coreHubs: [
        {
          file: "utils.js",
          name: "utils.js",
          dependentsCount: 2,
          blastRatio: 0.33,
          recommendation: "Core shared utility module with high inward coupling."
        },
        {
          file: "serviceA.js",
          name: "serviceA.js",
          dependentsCount: 2,
          blastRatio: 0.33,
          recommendation: "Service engine component participating in mutual dependencies."
        }
      ]
    },
    symbols: [
      { id: "App.jsx::App", name: "App", type: "function", file: "App.jsx", line: 4, endLine: 6, isExported: true, complexity: 1 },
      { id: "Badge.jsx::Badge", name: "Badge", type: "function", file: "Badge.jsx", line: 1, endLine: 3, isExported: true, complexity: 1 },
      { id: "dataEngine.js::handleComplexDataPipeline", name: "handleComplexDataPipeline", type: "function", file: "dataEngine.js", line: 5, endLine: 43, isExported: true, complexity: 14 },
      { id: "Graph.jsx::Graph", name: "Graph", type: "function", file: "Graph.jsx", line: 1, endLine: 3, isExported: true, complexity: 1 },
      { id: "serviceA.js::processA", name: "processA", type: "function", file: "serviceA.js", line: 3, endLine: 8, isExported: true, complexity: 2 },
      { id: "serviceB.js::processB", name: "processB", type: "function", file: "serviceB.js", line: 3, endLine: 8, isExported: true, complexity: 2 },
      { id: "utils.js::formatData", name: "formatData", type: "function", file: "utils.js", line: 1, endLine: 3, isExported: true, complexity: 1 },
      { id: "utils.js::DataFormatter", name: "DataFormatter", type: "class", file: "utils.js", line: 5, endLine: 5, isExported: true, complexity: 1 }
    ],
    functionCalls: [
      { file: "App.jsx", caller: "App", callee: "Graph", line: 5 },
      { file: "App.jsx", caller: "App", callee: "formatData", line: 5 },
      { file: "dataEngine.js", caller: "handleComplexDataPipeline", callee: "processA", line: 15 },
      { file: "dataEngine.js", caller: "handleComplexDataPipeline", callee: "processB", line: 17 },
      { file: "dataEngine.js", caller: "handleComplexDataPipeline", callee: "formatData", line: 19 },
      { file: "serviceA.js", caller: "processA", callee: "processB", line: 5 },
      { file: "serviceB.js", caller: "processB", callee: "processA", line: 7 }
    ],
    errors: []
  }
};
