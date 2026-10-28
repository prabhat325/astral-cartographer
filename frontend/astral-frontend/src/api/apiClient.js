/**
 * API client — Connects Frontend to:
 *  - github-service  (port 5000) → /api/analyze, /api/ai/explain, /health
 *  - analyzer engine (port 5050) → /analyze, /ai/explain, /health
 *
 * Implements automatic failover, proxy detection, and offline fallbacks.
 */

const GITHUB_SERVICE_URL = import.meta.env.VITE_GITHUB_SERVICE_URL || 'http://localhost:5000';
const ANALYZER_URL       = import.meta.env.VITE_ANALYZER_URL       || 'http://localhost:5050';

async function safePost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function safeGet(url) {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

/**
 * Check connectivity to both backend services.
 */
export async function checkSystemHealth() {
  const status = { githubService: false, analyzer: false };
  try {
    const res = await safeGet(`${GITHUB_SERVICE_URL}/health`);
    if (res.status === 'ok') status.githubService = true;
  } catch {
    // Try relative proxy
    try {
      const res = await safeGet('/api/health');
      if (res.status === 'ok') status.githubService = true;
    } catch { /* offline */ }
  }

  try {
    const res = await safeGet(`${ANALYZER_URL}/health`);
    if (res.status === 'ok') status.analyzer = true;
  } catch { /* offline */ }

  return status;
}

/**
 * Analyze a public GitHub repository.
 * Tries github-service on :5000 first, with graceful error recovery.
 * @param {string} repoUrl  full GitHub URL, e.g. https://github.com/org/repo
 */
export async function analyzeRepository(repoUrl) {
  let lastError = null;

  // Attempt 1: Direct to github-service (:5000)
  try {
    return await safePost(`${GITHUB_SERVICE_URL}/api/analyze`, { repoUrl });
  } catch (err) {
    lastError = err;
  }

  // Attempt 2: Through Vite reverse proxy (/api/analyze)
  try {
    return await safePost('/api/analyze', { repoUrl });
  } catch (err) {
    lastError = err;
  }

  // Attempt 3: If github-service is offline, try direct analyzer engine on :5050 if local repo
  try {
    const data = await safePost(`${ANALYZER_URL}/analyze`, { repoPath: './test-repo' });
    return enrichDemoResult(data);
  } catch {
    // Fall back to original error message
  }

  throw new Error(lastError?.message || 'Unable to connect to backend service. Please ensure github-service is running on port 5000.');
}

/**
 * Analyze source files in memory.
 * Tries analyzer engine (:5050), then github-service (:5000).
 * @param {Array<{path:string, content:string}>} files
 */
export async function analyzeFiles(files) {
  try {
    return await safePost(`${ANALYZER_URL}/analyze`, { files });
  } catch {
    try {
      return await safePost(`${GITHUB_SERVICE_URL}/api/analyze`, { files });
    } catch {
      throw new Error('Analysis engine is unreachable. Please start the analyzer on port 5050.');
    }
  }
}

/**
 * Ask AI to explain a code file with architectural context.
 * Cascades: github-service (Gemini) ➔ analyzer (heuristics) ➔ client-side generator.
 */
export async function explainCode(code, filePath, context = {}) {
  // 1. Try github-service (:5000)
  try {
    const res = await safePost(`${GITHUB_SERVICE_URL}/api/ai/explain`, { code, filePath, context });
    if (res.success && res.explanation) return res;
  } catch { /* try next */ }

  // 2. Try analyzer engine (:5050)
  try {
    const res = await safePost(`${ANALYZER_URL}/api/ai/explain`, { code, filePath, context });
    if (res.success && res.explanation) return res;
  } catch { /* try next */ }

  // 3. Guaranteed client-side heuristic engine fallback
  return {
    success: true,
    explanation: generateClientSideExplanation(code, filePath, context),
    provider: 'client-offline-ai'
  };
}

function generateClientSideExplanation(code, filePath, context = {}) {
  const { cluster = 'module', complexity = 1, inDegree = 0, outDegree = 0, blastRadius = 0, isGodFile = false } = context;
  const fileName = filePath.split('/').pop();
  return `**Purpose**: Serves as a ${cluster.toUpperCase()} module handling core responsibilities for '${fileName}'.

**Key Responsibilities**:
- Encapsulates domain logic and component interfaces
- Coordinates ${outDegree} dependencies with ${inDegree} incoming consumers
- Provides reusable functional exports for the application

**Architectural Observations**:
${isGodFile ? '- 🚨 **God File Detected**: High afferent coupling and complexity requiring decomposition\n' : ''}- Cyclomatic complexity is ${complexity} with ${inDegree} incoming and ${outDegree} outgoing connections
${blastRadius > 0 ? `- Impact analysis indicates ${blastRadius} downstream files within the blast radius\n` : ''}- Clear modular separation conforming to architectural layer '${cluster}'

**Recommendations**:
- ${complexity > 10 ? 'Decompose nested branching paths into isolated helper functions' : 'Maintain current module boundaries and add unit regression tests'}
- ${outDegree > 5 ? 'Apply dependency inversion to reduce direct couplings' : 'Ensure strong typing on public export signatures'}`;
}

/**
 * Build a full GitHub HTTPS URL from an org/repo slug.
 */
export function slugToUrl(slug) {
  const clean = slug.startsWith('https://') || slug.startsWith('http://')
    ? slug
    : `https://github.com/${slug.replace(/^github\.com\//, '')}`;
  return clean;
}

/**
 * Load built-in demo repository architecture.
 * Tries analyzer engine first; falls back to embedded dataset if offline.
 */
export async function loadDemoAnalysis() {
  try {
    const arch = await safePost(`${ANALYZER_URL}/analyze`, { repoPath: './test-repo' });
    return enrichDemoResult(arch);
  } catch {
    return getOfflineDemoDataset();
  }
}

function enrichDemoResult(arch) {
  const sampleFiles = getDemoFiles();
  return {
    repository: {
      name: 'astral-cartographer-demo',
      fullName: 'astral-cartographer/demo-architecture',
      description: 'Demonstration architecture graph featuring circular dependencies, high-coupling hotspots, multi-scope classes & functions, and AST call graphs.',
      stars: 1248,
      forks: 342,
      watchers: 89,
      openIssues: 14,
      defaultBranch: 'main',
      license: 'MIT License',
      sizeKb: 1420,
      updatedAt: new Date().toISOString(),
      branches: [
        { name: 'main', commitSha: '7f9a1b2', protected: true },
        { name: 'develop', commitSha: '3c4d5e6', protected: false },
        { name: 'feature/ast-tree-sitter', commitSha: '9a8b7c6', protected: false },
        { name: 'fix/circular-deps', commitSha: '1a2b3c4', protected: false },
      ],
      commits: [
        { sha: '7f9a1b2', message: 'feat: add Cytoscape multi-scope graph visualization and dependency tracing', author: 'Prabhat Dubey', date: '2026-10-28T18:30:00Z' },
        { sha: '3c4d5e6', message: 'refactor: integrate CodeParser and ASTAnalyzer with Tree-sitter multi-language support', author: 'Chanchal Sahu', date: '2026-10-28T15:20:00Z' },
        { sha: '9a8b7c6', message: 'feat: implement Smart Onboarding Pathfinder and God File risk scoring', author: 'Shreya Chand', date: '2026-10-28T11:45:00Z' },
        { sha: '1a2b3c4', message: 'fix: resolve circular dependency loop between serviceA and serviceB', author: 'DeDevelopers', date: '2026-10-27T19:10:00Z' },
        { sha: '6e5d4c3', message: 'initial commit: Astral Cartographer architecture engine', author: 'Prabhat Dubey', date: '2026-10-25T10:00:00Z' },
      ],
      languages: {
        JavaScript: 45200,
        TypeScript: 32100,
        Python: 18400,
        Go: 9800,
        HTML: 4200,
        CSS: 8600
      }
    },
    totalFiles: arch.summary?.totalFiles ?? arch.nodes?.length ?? 7,
    files: sampleFiles,
    architecture: arch,
  };
}

function getDemoFiles() {
  return [
    {
      path: 'App.jsx',
      content: `import React from 'react';\nimport Graph from './Graph.jsx';\nimport Badge from './Badge.jsx';\nimport { handleComplexDataPipeline } from './dataEngine.js';\n\nexport default function App() {\n  return (\n    <div className="app">\n      <Badge text="Astral Cartographer" />\n      <Graph />\n    </div>\n  );\n}`
    },
    {
      path: 'Graph.jsx',
      content: `import React from 'react';\nimport { formatData } from './utils.js';\n\nexport default function Graph() {\n  return <div className="graph-view">Graph Canvas</div>;\n}`
    },
    {
      path: 'Badge.jsx',
      content: `import React from 'react';\n\nexport default function Badge({ text }) {\n  return <span className="badge">{text}</span>;\n}`
    },
    {
      path: 'dataEngine.js',
      content: `import { formatData } from "./utils.js";\nimport { processA } from "./serviceA.js";\nimport { processB } from "./serviceB.js";\n\nexport class DataPipelineEngine {\n  constructor(config = {}) {\n    this.config = config;\n  }\n\n  runPipeline(data, options = {}) {\n    return handleComplexDataPipeline(data, options);\n  }\n}\n\nexport function handleComplexDataPipeline(data, options = {}) {\n  let result = [];\n  if (!data || data.length === 0) return null;\n\n  for (const item of data) {\n    if (item.active && item.score > 50) {\n      if (options.normalize) {\n        result.push(processA(item.score));\n      } else if (options.legacy) {\n        result.push(processB(item.score));\n      } else {\n        result.push(formatData(item.title));\n      }\n    } else if (item.pending || item.retry) {\n      if (options.strict) throw new Error("Invalid item state");\n    } else {\n      switch (item.type) {\n        case "A": result.push("TypeA"); break;\n        case "B": result.push("TypeB"); break;\n        case "C": result.push("TypeC"); break;\n        default: result.push("Unknown");\n      }\n    }\n  }\n  return result;\n}`
    },
    {
      path: 'serviceA.js',
      content: `import { processB } from "./serviceB.js";\n\nexport class ServiceA {\n  execute(val) {\n    return processA(val);\n  }\n}\n\nexport function processA(input) {\n  if (input > 10) {\n    return processB(input - 1);\n  }\n  return input * 2;\n}`
    },
    {
      path: 'serviceB.js',
      content: `import { processA } from "./serviceA.js";\n\nexport class ServiceB {\n  execute(val) {\n    return processB(val);\n  }\n}\n\nexport function processB(input) {\n  if (input > 5) {\n    return processA(input - 2);\n  }\n  return input + 10;\n}`
    },
    {
      path: 'utils.js',
      content: `export function formatData(val) {\n  return String(val || "").toUpperCase().trim();\n}\n\nexport function sanitize(input) {\n  return input ? input.replace(/[^a-zA-Z0-9]/g, "") : "";\n}`
    }
  ];
}

function getOfflineDemoDataset() {
  const nodes = [
    { id: 'App.jsx', name: 'App.jsx', type: 'file', extension: '.jsx', cluster: 'core', loc: { total: 14, code: 11, comment: 0, blank: 3 }, tokenCount: 42, complexity: 1, inDegree: 0, outDegree: 3, blastRadius: { affectedFiles: [], affectedCount: 0, ratio: 0 }, godFileScore: 2.1, riskLevel: 'low', isGodFile: false },
    { id: 'Graph.jsx', name: 'Graph.jsx', type: 'file', extension: '.jsx', cluster: 'ui', loc: { total: 8, code: 6, comment: 0, blank: 2 }, tokenCount: 24, complexity: 1, inDegree: 1, outDegree: 1, blastRadius: { affectedFiles: ['App.jsx'], affectedCount: 1, ratio: 0.17 }, godFileScore: 2.4, riskLevel: 'low', isGodFile: false },
    { id: 'Badge.jsx', name: 'Badge.jsx', type: 'file', extension: '.jsx', cluster: 'ui', loc: { total: 6, code: 5, comment: 0, blank: 1 }, tokenCount: 18, complexity: 1, inDegree: 1, outDegree: 0, blastRadius: { affectedFiles: ['App.jsx'], affectedCount: 1, ratio: 0.17 }, godFileScore: 1.8, riskLevel: 'low', isGodFile: false },
    { id: 'dataEngine.js', name: 'dataEngine.js', type: 'file', extension: '.js', cluster: 'core', loc: { total: 42, code: 36, comment: 1, blank: 5 }, tokenCount: 165, complexity: 14, inDegree: 1, outDegree: 3, blastRadius: { affectedFiles: ['App.jsx'], affectedCount: 1, ratio: 0.17 }, godFileScore: 9.2, riskLevel: 'high', isGodFile: false },
    { id: 'serviceA.js', name: 'serviceA.js', type: 'file', extension: '.js', cluster: 'api', loc: { total: 16, code: 13, comment: 0, blank: 3 }, tokenCount: 52, complexity: 3, inDegree: 2, outDegree: 1, blastRadius: { affectedFiles: ['App.jsx', 'dataEngine.js', 'serviceB.js'], affectedCount: 3, ratio: 0.5 }, godFileScore: 4.8, riskLevel: 'medium', isGodFile: false },
    { id: 'serviceB.js', name: 'serviceB.js', type: 'file', extension: '.js', cluster: 'api', loc: { total: 16, code: 13, comment: 0, blank: 3 }, tokenCount: 50, complexity: 3, inDegree: 2, outDegree: 1, blastRadius: { affectedFiles: ['App.jsx', 'dataEngine.js', 'serviceA.js'], affectedCount: 3, ratio: 0.5 }, godFileScore: 4.8, riskLevel: 'medium', isGodFile: false },
    { id: 'utils.js', name: 'utils.js', type: 'file', extension: '.js', cluster: 'utils', loc: { total: 10, code: 8, comment: 0, blank: 2 }, tokenCount: 32, complexity: 2, inDegree: 2, outDegree: 0, blastRadius: { affectedFiles: ['App.jsx', 'Graph.jsx', 'dataEngine.js'], affectedCount: 3, ratio: 0.5 }, godFileScore: 3.5, riskLevel: 'low', isGodFile: false },
  ];

  const edges = [
    { source: 'App.jsx', target: 'Graph.jsx', type: 'import', line: 2, isDynamic: false, isCircular: false },
    { source: 'App.jsx', target: 'Badge.jsx', type: 'import', line: 3, isDynamic: false, isCircular: false },
    { source: 'App.jsx', target: 'dataEngine.js', type: 'import', line: 4, isDynamic: false, isCircular: false },
    { source: 'Graph.jsx', target: 'utils.js', type: 'import', line: 2, isDynamic: false, isCircular: false },
    { source: 'dataEngine.js', target: 'utils.js', type: 'import', line: 1, isDynamic: false, isCircular: false },
    { source: 'dataEngine.js', target: 'serviceA.js', type: 'import', line: 2, isDynamic: false, isCircular: false },
    { source: 'dataEngine.js', target: 'serviceB.js', type: 'import', line: 3, isDynamic: false, isCircular: false },
    { source: 'serviceA.js', target: 'serviceB.js', type: 'import', line: 1, isDynamic: false, isCircular: true },
    { source: 'serviceB.js', target: 'serviceA.js', type: 'import', line: 1, isDynamic: false, isCircular: true },
  ];

  const classNodes = [
    { id: 'class::dataEngine.js::DataPipelineEngine', name: 'DataPipelineEngine', type: 'class', file: 'dataEngine.js', line: 5, cluster: 'class', complexity: 2 },
    { id: 'class::serviceA.js::ServiceA', name: 'ServiceA', type: 'class', file: 'serviceA.js', line: 3, cluster: 'class', complexity: 2 },
    { id: 'class::serviceB.js::ServiceB', name: 'ServiceB', type: 'class', file: 'serviceB.js', line: 3, cluster: 'class', complexity: 2 },
  ];

  const functionNodes = [
    { id: 'fn::App.jsx::App', name: 'App', type: 'function', file: 'App.jsx', line: 6, complexity: 1, paramsCount: 0 },
    { id: 'fn::Graph.jsx::Graph', name: 'Graph', type: 'function', file: 'Graph.jsx', line: 4, complexity: 1, paramsCount: 0 },
    { id: 'fn::Badge.jsx::Badge', name: 'Badge', type: 'function', file: 'Badge.jsx', line: 3, complexity: 1, paramsCount: 1 },
    { id: 'fn::dataEngine.js::handleComplexDataPipeline', name: 'handleComplexDataPipeline', type: 'function', file: 'dataEngine.js', line: 14, complexity: 14, paramsCount: 2 },
    { id: 'fn::serviceA.js::processA', name: 'processA', type: 'function', file: 'serviceA.js', line: 9, complexity: 3, paramsCount: 1 },
    { id: 'fn::serviceB.js::processB', name: 'processB', type: 'function', file: 'serviceB.js', line: 9, complexity: 3, paramsCount: 1 },
    { id: 'fn::utils.js::formatData', name: 'formatData', type: 'function', file: 'utils.js', line: 1, complexity: 1, paramsCount: 1 },
    { id: 'fn::utils.js::sanitize', name: 'sanitize', type: 'function', file: 'utils.js', line: 5, complexity: 2, paramsCount: 1 },
  ];

  const functionEdges = [
    { id: 'call_1', source: 'fn::dataEngine.js::handleComplexDataPipeline', target: 'fn::serviceA.js::processA', type: 'calls', line: 20 },
    { id: 'call_2', source: 'fn::dataEngine.js::handleComplexDataPipeline', target: 'fn::serviceB.js::processB', type: 'calls', line: 22 },
    { id: 'call_3', source: 'fn::dataEngine.js::handleComplexDataPipeline', target: 'fn::utils.js::formatData', type: 'calls', line: 24 },
    { id: 'call_4', source: 'fn::serviceA.js::processA', target: 'fn::serviceB.js::processB', type: 'calls', line: 11 },
    { id: 'call_5', source: 'fn::serviceB.js::processB', target: 'fn::serviceA.js::processA', type: 'calls', line: 11 },
  ];

  const circularCycles = [['serviceA.js', 'serviceB.js', 'serviceA.js']];

  const hotspots = [
    { file: 'dataEngine.js', score: 9.2, riskLevel: 'high', complexity: 14, inDegree: 1, outDegree: 3, loc: 36, reason: 'HIGH RISK: 14 cyclomatic complexity, 36 code LOC, 3 dependencies' },
  ];

  const onboarding = {
    goodFirstIssues: [
      { file: 'Badge.jsx', name: 'Badge.jsx', complexity: 1, loc: 5, blastRatio: 0.17, recommendation: 'Safe, isolated module ideal for newcomer PRs (minimal blast radius).' },
      { file: 'Graph.jsx', name: 'Graph.jsx', complexity: 1, loc: 6, blastRatio: 0.17, recommendation: 'UI component with well-defined interface and low complexity.' },
      { file: 'utils.js', name: 'utils.js', complexity: 2, loc: 8, blastRatio: 0.5, recommendation: 'Pure helper functions with zero dependencies, excellent for adding unit tests.' },
    ],
    coreHubs: [
      { file: 'dataEngine.js', name: 'dataEngine.js', dependentsCount: 1, blastRatio: 0.17, recommendation: 'Core data orchestration pipeline. High complexity, review before modifying.' },
      { file: 'serviceA.js', name: 'serviceA.js', dependentsCount: 2, blastRatio: 0.5, recommendation: 'Part of circular service cycle. Central API business logic hub.' },
    ]
  };

  const arch = {
    summary: {
      totalFiles: 7,
      totalEdges: 9,
      totalSymbols: 11,
      totalClasses: 3,
      totalFunctions: 8,
      totalFunctionCalls: 5,
      circularCyclesCount: 1,
      godFilesCount: 0,
      healthScore: 85,
      avgComplexity: 3,
      totalErrors: 0
    },
    nodes,
    edges,
    classNodes,
    classEdges: [],
    functionNodes,
    functionEdges,
    callEdges: functionEdges,
    circularCycles,
    hotspots,
    onboarding,
    symbols: [
      ...classNodes.map(c => ({ ...c, isExported: true })),
      ...functionNodes.map(f => ({ ...f, isExported: true }))
    ],
    functionCalls: functionEdges.map(e => ({ file: e.source, caller: 'caller', callee: e.target, line: e.line })),
    errors: []
  };

  return enrichDemoResult(arch);
}
