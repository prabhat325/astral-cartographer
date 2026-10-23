import path from "node:path";

/**
 * 1. Cycle Detection (Circular Dependencies)
 * Uses DFS with back-edge tracking to find all elementary cycles in the file import graph.
 */
export function detectCircularDependencies(nodes, edges) {
  const adj = new Map();
  for (const node of nodes) {
    adj.set(node.id, []);
  }

  for (const edge of edges) {
    if (edge.type === "import" || edge.type === "re-export") {
      if (adj.has(edge.source) && adj.has(edge.target)) {
        adj.get(edge.source).push(edge.target);
      }
    }
  }

  const visited = new Set();
  const recStack = new Set();
  const currentPath = [];
  const cycles = [];
  const cycleSignatureSet = new Set();

  function dfs(u) {
    visited.add(u);
    recStack.add(u);
    currentPath.push(u);

    for (const v of adj.get(u) || []) {
      if (!visited.has(v)) {
        dfs(v);
      } else if (recStack.has(v)) {
        // Cycle detected: slice from where 'v' first appears in current path
        const cycleStartIndex = currentPath.indexOf(v);
        if (cycleStartIndex !== -1) {
          const cycle = currentPath.slice(cycleStartIndex).concat(v);
          // Normalize cycle to avoid duplicate representations
          const minIndex = cycle.slice(0, -1).reduce((minIdx, curr, idx, arr) => {
            return curr < arr[minIdx] ? idx : minIdx;
          }, 0);

          const rotated = [
            ...cycle.slice(minIndex, -1),
            ...cycle.slice(0, minIndex),
            cycle[minIndex]
          ];
          const sig = rotated.join(" -> ");

          if (!cycleSignatureSet.has(sig)) {
            cycleSignatureSet.add(sig);
            cycles.push(cycle);
          }
        }
      }
    }

    currentPath.pop();
    recStack.delete(u);
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  }

  // Create a set of cycle edge pairs for quick lookup: "source::target"
  const cycleEdgesSet = new Set();
  for (const cycle of cycles) {
    for (let i = 0; i < cycle.length - 1; i++) {
      cycleEdgesSet.add(`${cycle[i]}:::${cycle[i + 1]}`);
    }
  }

  return {
    cycles,
    cycleEdgesSet
  };
}

/**
 * 2. Architectural Cluster / Layer Detection
 */
export function detectCluster(filePath) {
  const normalized = filePath.toLowerCase().replace(/\\/g, "/");
  const baseName = path.basename(normalized);
  const ext = path.extname(normalized);

  if (baseName.startsWith("index.") || baseName.startsWith("main.") || baseName.startsWith("app.")) {
    return "core";
  }

  if (
    normalized.includes("/component") ||
    normalized.includes("/view") ||
    normalized.includes("/page") ||
    normalized.includes("/ui") ||
    ext === ".jsx" ||
    ext === ".tsx"
  ) {
    return "ui";
  }

  if (
    normalized.includes("/api") ||
    normalized.includes("/service") ||
    normalized.includes("/endpoint") ||
    normalized.includes("/query")
  ) {
    return "api";
  }

  if (
    normalized.includes("/store") ||
    normalized.includes("/redux") ||
    normalized.includes("/context") ||
    normalized.includes("/hook") ||
    normalized.includes("/state")
  ) {
    return "state";
  }

  if (
    normalized.includes("/util") ||
    normalized.includes("/helper") ||
    normalized.includes("/lib") ||
    normalized.includes("/common")
  ) {
    return "utils";
  }

  if (
    normalized.includes("/type") ||
    normalized.includes("/model") ||
    normalized.includes("/config") ||
    normalized.includes("/constant")
  ) {
    return "config";
  }

  // Fallback to top-level folder name or 'module'
  const parts = normalized.split("/");
  if (parts.length > 1) {
    return parts[0];
  }

  return "module";
}

/**
 * 3. Transitive Blast Radius (Reverse Dependency Graph Traversal)
 * If file X is modified, which downstream files depend on it?
 */
export function computeBlastRadius(nodes, edges) {
  // Reverse graph: target -> sources (who depends on target?)
  const reverseAdj = new Map();
  for (const node of nodes) {
    reverseAdj.set(node.id, []);
  }

  for (const edge of edges) {
    if ((edge.type === "import" || edge.type === "re-export") && reverseAdj.has(edge.target)) {
      reverseAdj.get(edge.target).push(edge.source);
    }
  }

  const blastRadiusMap = new Map();
  const totalFiles = Math.max(1, nodes.length);

  for (const node of nodes) {
    const visited = new Set();
    const queue = [node.id];

    while (queue.length > 0) {
      const curr = queue.shift();
      for (const parent of reverseAdj.get(curr) || []) {
        if (!visited.has(parent) && parent !== node.id) {
          visited.add(parent);
          queue.push(parent);
        }
      }
    }

    const affectedCount = visited.size;
    const ratio = totalFiles > 1 ? Number((affectedCount / (totalFiles - 1)).toFixed(2)) : 0;

    blastRadiusMap.set(node.id, {
      affectedFiles: Array.from(visited),
      affectedCount,
      ratio
    });
  }

  return blastRadiusMap;
}

/**
 * 4. God File & Technical Debt Hotspot Detection
 */
export function computeArchitecturalHotspots(nodeDataList) {
  const hotspots = [];

  for (const node of nodeDataList) {
    const loc = node.loc?.code ?? 1;
    const complexity = node.complexity ?? 1;
    const inDegree = node.inDegree ?? 0;
    const outDegree = node.outDegree ?? 0;

    // Composite God File Score
    // High in-degree (many dependents) + high complexity + high LOC = high risk
    const godScore = Number(
      (inDegree * 1.5 + outDegree * 0.8 + complexity * 0.4 + (loc / 25) * 0.3).toFixed(1)
    );

    let riskLevel = "low";
    let isGodFile = false;

    if (godScore >= 18 || (complexity >= 15 && inDegree >= 5)) {
      riskLevel = "critical";
      isGodFile = true;
    } else if (godScore >= 10 || complexity >= 10 || inDegree >= 4) {
      riskLevel = "high";
    } else if (godScore >= 5 || complexity >= 6) {
      riskLevel = "medium";
    }

    node.godFileScore = godScore;
    node.riskLevel = riskLevel;
    node.isGodFile = isGodFile;

    if (riskLevel === "critical" || riskLevel === "high") {
      hotspots.push({
        file: node.id,
        score: godScore,
        riskLevel,
        complexity,
        inDegree,
        outDegree,
        loc,
        reason: `${riskLevel.toUpperCase()} RISK: ${inDegree} dependants, ${complexity} cyclomatic complexity, ${loc} LOC.`
      });
    }
  }

  hotspots.sort((a, b) => b.score - a.score);
  return hotspots;
}

/**
 * 5. Smart Onboarding Pathfinder (Good First Issues & Safe Entry Points)
 */
export function computeOnboardingPathways(nodeDataList, cycles) {
  const cycleFileSet = new Set(cycles.flat());
  const goodFirstIssues = [];
  const coreHubs = [];

  for (const node of nodeDataList) {
    const inCycle = cycleFileSet.has(node.id);
    const loc = node.loc?.code ?? 0;
    const complexity = node.complexity ?? 1;
    const inDegree = node.inDegree ?? 0;
    const blastRatio = node.blastRadius?.ratio ?? 0;

    // Good First Issue: low complexity, low LOC, isolated or leaf node, not in cycles
    if (!inCycle && complexity <= 5 && loc <= 80 && inDegree <= 1 && blastRatio <= 0.2) {
      goodFirstIssues.push({
        file: node.id,
        name: node.name,
        complexity,
        loc,
        blastRatio,
        recommendation: "Safe, isolated module ideal for newcomer PRs (minimal blast radius)."
      });
    }

    // Core architectural hubs (critical understanding required)
    if (node.inDegree >= 3 || node.blastRadius?.ratio >= 0.5) {
      coreHubs.push({
        file: node.id,
        name: node.name,
        dependentsCount: inDegree,
        blastRatio,
        recommendation: "Core architectural hub. Read first to understand overall repository flow."
      });
    }
  }

  return {
    goodFirstIssues: goodFirstIssues.slice(0, 10),
    coreHubs: coreHubs.slice(0, 10)
  };
}

/**
 * 6. Overall Repository Health Score (0 - 100)
 */
export function computeRepositoryHealthScore({
  totalFiles,
  circularCyclesCount,
  godFilesCount,
  avgComplexity
}) {
  if (totalFiles === 0) return 100;

  let score = 100;

  // Deduct for circular import cycles (severely damages modularity)
  score -= Math.min(40, circularCyclesCount * 15);

  // Deduct for god files
  score -= Math.min(30, godFilesCount * 10);

  // Deduct for excessive average complexity
  if (avgComplexity > 10) {
    score -= Math.min(20, Math.round((avgComplexity - 10) * 3));
  }

  return Math.max(10, Math.min(100, score));
}
