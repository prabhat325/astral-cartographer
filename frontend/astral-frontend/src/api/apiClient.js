/**
 * API client — connects to:
 *  - github-service  (port 5000) → POST /api/analyze
 *  - analyzer server (port 5050) → POST /analyze, GET /health
 */

const GITHUB_SERVICE_URL = import.meta.env.VITE_GITHUB_SERVICE_URL || 'http://localhost:5000';
const ANALYZER_URL       = import.meta.env.VITE_ANALYZER_URL       || 'http://localhost:5050';

async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function get(url) {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

/**
 * Analyze a public GitHub repository via the github-service.
 * @param {string} repoUrl  full GitHub URL, e.g. https://github.com/org/repo
 */
export async function analyzeRepository(repoUrl) {
  return post(`${GITHUB_SERVICE_URL}/api/analyze`, { repoUrl });
}

/**
 * Analyze files in-memory via the analyzer server.
 * @param {Array<{path:string, content:string}>} files
 */
export async function analyzeFiles(files) {
  return post(`${ANALYZER_URL}/analyze`, { files });
}

/**
 * Health check for the analyzer engine.
 */
export async function getAnalyzerHealth() {
  return get(`${ANALYZER_URL}/health`);
}

/**
 * Build a full GitHub HTTPS URL from an org/repo slug.
 */
export function slugToUrl(slug) {
  const clean = slug.startsWith('https://') ? slug : `https://github.com/${slug.replace(/^github\.com\//, '')}`;
  return clean;
}

/**
 * Load built-in demo repository architecture directly from the analyzer engine
 * (Bypasses GitHub API rate limits so users can explore immediately).
 */
export async function loadDemoAnalysis() {
  const arch = await post(`${ANALYZER_URL}/analyze`, { repoPath: './test-repo' });
  return {
    repository: {
      name: 'astral-demo-repo',
      fullName: 'astral-cartographer/demo-architecture',
      description: 'Demonstration architecture graph featuring circular dependencies, high-coupling hotspots, and AST call graphs.',
    },
    totalFiles: arch.summary?.totalFiles ?? arch.nodes?.length ?? 0,
    files: (arch.nodes || []).map(n => ({
      path: n.id,
      content: `// Source module: ${n.id}\n// LOC: ${n.loc?.code || 0} lines | Complexity: ${n.complexity || 1}\n\nexport default function ${n.label || 'module'}() {\n  return "${n.id}";\n}\n`
    })),
    architecture: arch,
  };
}
