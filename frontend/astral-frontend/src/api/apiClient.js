/**
 * Astral Cartographer — API Client
 * Connects to:
 *  - github-service  (port 5000) -> POST /api/analyze or /analyze
 *  - analyzer server (port 5050) -> POST /analyze, GET /health
 */
import { DEMO_ANALYSIS } from './demoData';

const GITHUB_SERVICE_URL = import.meta.env.VITE_GITHUB_SERVICE_URL || 'http://localhost:5000';
const ANALYZER_URL       = import.meta.env.VITE_ANALYZER_URL       || 'http://localhost:5050';

async function post(url, body) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}: Failed to process analysis`);
    }
    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message?.includes('fetch')) {
      throw new Error(`Unable to connect to backend service at ${url}. Please ensure github-service is running.`);
    }
    throw err;
  }
}

async function get(url) {
  try {
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}: Request failed`);
    }
    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message?.includes('fetch')) {
      throw new Error(`Unable to connect to service at ${url}.`);
    }
    throw err;
  }
}

/**
 * Normalize an analysis response from either github-service or analyzer engine
 */
export function normalizeAnalysisResult(data) {
  if (!data) return null;

  const architecture = data.architecture || data;
  const nodes = architecture.nodes || [];
  const edges = architecture.edges || [];
  const callEdges = architecture.callEdges || [];
  const circularCycles = architecture.circularCycles || [];
  const hotspots = architecture.hotspots || [];
  const symbols = architecture.symbols || [];
  const functionCalls = architecture.functionCalls || [];
  const errors = architecture.errors || [];

  // Normalize onboarding
  let onboarding = { goodFirstIssues: [], coreHubs: [] };
  if (architecture.onboarding) {
    if (Array.isArray(architecture.onboarding)) {
      onboarding = {
        goodFirstIssues: architecture.onboarding.map((f) => (typeof f === 'string' ? { file: f, name: f, complexity: 1, loc: 10, blastRatio: 0, recommendation: 'Safe entry module' } : f)),
        coreHubs: []
      };
    } else {
      onboarding = {
        goodFirstIssues: architecture.onboarding.goodFirstIssues || [],
        coreHubs: architecture.onboarding.coreHubs || []
      };
    }
  }

  const summary = {
    totalFiles: architecture.summary?.totalFiles ?? nodes.length ?? (data.files?.length || 0),
    totalEdges: architecture.summary?.totalEdges ?? edges.length ?? 0,
    totalSymbols: architecture.summary?.totalSymbols ?? symbols.length ?? 0,
    totalFunctionCalls: architecture.summary?.totalFunctionCalls ?? (callEdges.length || functionCalls.length) ?? 0,
    circularCyclesCount: architecture.summary?.circularCyclesCount ?? circularCycles.length ?? 0,
    godFilesCount: architecture.summary?.godFilesCount ?? nodes.filter(n => n.isGodFile).length ?? 0,
    healthScore: architecture.summary?.healthScore ?? 85,
    totalErrors: architecture.summary?.totalErrors ?? errors.length ?? 0
  };

  return {
    repository: data.repository || {
      name: 'Repository Analysis',
      fullName: 'astral-analysis',
      description: 'AST Architecture Topology Analysis'
    },
    totalFiles: data.totalFiles || summary.totalFiles,
    files: data.files || nodes.map(n => ({ path: n.id || n.name, content: `// Source module: ${n.id}\n// Ext: ${n.extension}\n` })),
    architecture: {
      summary,
      nodes,
      edges,
      callEdges,
      circularCycles,
      hotspots,
      onboarding,
      symbols,
      functionCalls,
      errors
    }
  };
}

/**
 * Analyze a public GitHub repository via the github-service.
 * @param {string} repoUrl  full GitHub URL, e.g. https://github.com/org/repo
 */
export async function analyzeRepository(repoUrl) {
  try {
    const data = await post(`${GITHUB_SERVICE_URL}/api/analyze`, { repoUrl });
    return normalizeAnalysisResult(data);
  } catch (err) {
    // If /api/analyze fails, try fallback route /analyze on port 5000
    try {
      const fallbackData = await post(`${GITHUB_SERVICE_URL}/analyze`, { repoUrl });
      return normalizeAnalysisResult(fallbackData);
    } catch {
      throw err;
    }
  }
}

/**
 * Analyze files in-memory via the analyzer server.
 * @param {Array<{path:string, content:string}>} files
 */
export async function analyzeFiles(files) {
  const data = await post(`${ANALYZER_URL}/analyze`, { files });
  return normalizeAnalysisResult(data);
}

/**
 * Health check for the analyzer engine.
 */
export async function getAnalyzerHealth() {
  return get(`${ANALYZER_URL}/health`);
}

/**
 * Build a full GitHub HTTPS URL from an org/repo slug or URL.
 */
export function slugToUrl(slug) {
  if (!slug || typeof slug !== 'string') return '';
  let clean = slug.trim();
  // Strip trailing slashes and .git
  clean = clean.replace(/\/+$/, '').replace(/\.git$/, '');
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }
  clean = clean.replace(/^github\.com\//i, '');
  return `https://github.com/${clean}`;
}

/**
 * Load built-in demo repository architecture directly from the analyzer engine,
 * or gracefully fallback to the pre-analyzed demo dataset if analyzer server is not active.
 */
export async function loadDemoAnalysis() {
  try {
    const arch = await post(`${ANALYZER_URL}/analyze`, { repoPath: './test-repo' });
    return normalizeAnalysisResult({
      repository: DEMO_ANALYSIS.repository,
      totalFiles: arch.summary?.totalFiles ?? arch.nodes?.length ?? DEMO_ANALYSIS.totalFiles,
      files: DEMO_ANALYSIS.files,
      architecture: arch
    });
  } catch {
    // Fall back smoothly to authentic sample data computed by the AST analyzer engine
    return normalizeAnalysisResult(DEMO_ANALYSIS);
  }
}
