import path from "node:path";
import {
  detectCircularDependencies,
  detectCluster,
  computeBlastRadius,
  computeArchitecturalHotspots,
  computeOnboardingPathways,
  computeRepositoryHealthScore
} from "./graphIntelligence.js";

const EXTENSIONS = [
  "", ".js", ".jsx", ".mjs", ".cjs",
  ".ts", ".tsx", ".mts", ".cts"
];

export function resolveImport(sourceFile, importPath, fileSet) {
  if (!importPath || !importPath.startsWith(".")) return null;

  const base = path.posix.normalize(
    path.posix.join(path.posix.dirname(sourceFile), importPath)
  );

  const candidates = [
    ...EXTENSIONS.map((ext) => base + ext),
    ...EXTENSIONS.slice(1).map(
      (ext) => path.posix.join(base, `index${ext}`)
    )
  ];

  return candidates.find((candidate) => fileSet.has(candidate)) ?? null;
}

export function buildGraph(files, importsByFile, functionCalls = [], fileMetrics = {}) {
  const fileSet = new Set(files.map((file) => file.path));

  // 1. Build initial raw file edges
  const rawEdges = [];
  const inDegreeMap = new Map();
  const outDegreeMap = new Map();

  for (const file of files) {
    inDegreeMap.set(file.path, 0);
    outDegreeMap.set(file.path, 0);
  }

  for (const file of files) {
    const fileImports = importsByFile[file.path] ?? [];
    for (const item of fileImports) {
      const target = resolveImport(file.path, item.source, fileSet);

      if (target) {
        rawEdges.push({
          source: file.path,
          target,
          type: item.kind || "import",
          line: item.line ?? null,
          isDynamic: Boolean(item.isDynamic)
        });

        outDegreeMap.set(file.path, (outDegreeMap.get(file.path) || 0) + 1);
        inDegreeMap.set(target, (inDegreeMap.get(target) || 0) + 1);
      }
    }
  }

  // 2. Initial node objects
  const rawNodes = files.map((file) => {
    const metrics = fileMetrics[file.path] || {
      loc: { total: 0, code: 0, comment: 0, blank: 0 },
      tokenCount: 0,
      complexity: 1,
      functionComplexities: []
    };

    return {
      id: file.path,
      name: path.basename(file.path),
      type: "file",
      extension: path.extname(file.path).toLowerCase(),
      cluster: detectCluster(file.path),
      loc: metrics.loc,
      tokenCount: metrics.tokenCount,
      complexity: metrics.complexity,
      inDegree: inDegreeMap.get(file.path) || 0,
      outDegree: outDegreeMap.get(file.path) || 0
    };
  });

  // 3. Circular Dependency Detection
  const { cycles, cycleEdgesSet } = detectCircularDependencies(rawNodes, rawEdges);

  // 4. Annotate edges with circular flag & unique ID
  const edges = rawEdges.map((edge) => ({
    ...edge,
    isCircular: cycleEdgesSet.has(`${edge.source}:::${edge.target}`)
  }));

  // 5. Blast Radius Computation
  const blastRadiusMap = computeBlastRadius(rawNodes, edges);
  for (const node of rawNodes) {
    node.blastRadius = blastRadiusMap.get(node.id) || {
      affectedFiles: [],
      affectedCount: 0,
      ratio: 0
    };
  }

  // 6. God File & Technical Debt Hotspot Scoring
  const hotspots = computeArchitecturalHotspots(rawNodes);

  // 7. Smart Onboarding Pathfinder
  const onboarding = computeOnboardingPathways(rawNodes, cycles);

  // 8. Repository Health Score
  const godFilesCount = rawNodes.filter((n) => n.isGodFile).length;
  const avgComplexity =
    rawNodes.length > 0
      ? Math.round(
          rawNodes.reduce((acc, curr) => acc + (curr.complexity || 1), 0) / rawNodes.length
        )
      : 1;

  const healthScore = computeRepositoryHealthScore({
    totalFiles: rawNodes.length,
    circularCyclesCount: cycles.length,
    godFilesCount,
    avgComplexity
  });

  // 9. Symbol / Call Graph Edges (with caller & callee)
  const callEdges = functionCalls.map((call) => ({
    source: `${call.file}::${call.caller}`,
    target: call.callee,
    type: "calls",
    line: call.line
  }));

  return {
    nodes: rawNodes,
    edges,
    callEdges,
    circularCycles: cycles,
    hotspots,
    onboarding,
    healthScore
  };
}
