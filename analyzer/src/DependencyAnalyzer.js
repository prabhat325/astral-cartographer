import path from "node:path";
import {
  detectCircularDependencies,
  detectCluster,
  computeBlastRadius,
  computeArchitecturalHotspots,
  computeOnboardingPathways,
  computeRepositoryHealthScore
} from "./graphIntelligence.js";

/**
 * DependencyAnalyzer — Identifies and analyzes relationships between code components,
 * computing coupling, circular dependencies, blast radius, clusters, and architectural health.
 */
export class DependencyAnalyzer {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Run full dependency analysis on files, imports, and metrics.
   * @param {Array<{path: string, content: string}>} files
   * @param {Record<string, Array<any>>} importsByFile
   * @param {Record<string, any>} fileMetrics
   */
  analyze(files, importsByFile, fileMetrics = {}) {
    const fileSet = new Set(files.map((f) => f.path));

    const inDegreeMap = new Map();
    const outDegreeMap = new Map();
    for (const f of files) {
      inDegreeMap.set(f.path, 0);
      outDegreeMap.set(f.path, 0);
    }

    const rawEdges = [];
    for (const file of files) {
      const fileImports = importsByFile[file.path] || [];
      for (const item of fileImports) {
        const target = this.resolveImport(file.path, item.source, fileSet);
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

    // Build raw nodes
    const rawNodes = files.map((file) => {
      const metrics = fileMetrics[file.path] || {
        loc: { total: 0, code: 0, comment: 0, blank: 0 },
        tokenCount: 0,
        complexity: 1,
        functionComplexities: []
      };

      const inD = inDegreeMap.get(file.path) || 0;
      const outD = outDegreeMap.get(file.path) || 0;
      const totalCoupling = inD + outD;
      const instability = totalCoupling > 0 ? Number((outD / totalCoupling).toFixed(2)) : 0;

      return {
        id: file.path,
        name: path.basename(file.path),
        type: "file",
        extension: path.extname(file.path).toLowerCase(),
        cluster: detectCluster(file.path),
        loc: metrics.loc,
        tokenCount: metrics.tokenCount,
        complexity: metrics.complexity,
        inDegree: inD,
        outDegree: outD,
        instability
      };
    });

    // 1. Detect circular cycles
    const { cycles, cycleEdgesSet } = detectCircularDependencies(rawNodes, rawEdges);

    // 2. Annotate edges with circular status
    const edges = rawEdges.map((e) => ({
      ...e,
      isCircular: cycleEdgesSet.has(`${e.source}:::${e.target}`)
    }));

    // 3. Compute blast radius
    const blastMap = computeBlastRadius(rawNodes, edges);
    for (const node of rawNodes) {
      node.blastRadius = blastMap.get(node.id) || {
        affectedFiles: [],
        affectedCount: 0,
        ratio: 0
      };
    }

    // 4. Hotspots and God files
    const hotspots = computeArchitecturalHotspots(rawNodes);

    // 5. Onboarding pathfinder
    const onboarding = computeOnboardingPathways(rawNodes, cycles);

    // 6. Overall health score
    const godFilesCount = rawNodes.filter((n) => n.isGodFile).length;
    const avgComplexity = rawNodes.length > 0
      ? Math.round(rawNodes.reduce((acc, curr) => acc + (curr.complexity || 1), 0) / rawNodes.length)
      : 1;

    const healthScore = computeRepositoryHealthScore({
      totalFiles: rawNodes.length,
      circularCyclesCount: cycles.length,
      godFilesCount,
      avgComplexity
    });

    return {
      nodes: rawNodes,
      edges,
      circularCycles: cycles,
      hotspots,
      onboarding,
      healthScore,
      avgComplexity,
      godFilesCount
    };
  }

  /**
   * Resolve an import path relative to source file.
   */
  resolveImport(sourceFile, importPath, fileSet) {
    if (!importPath || typeof importPath !== "string") return null;

    const EXTENSIONS = [
      "", ".js", ".jsx", ".mjs", ".cjs",
      ".ts", ".tsx", ".mts", ".cts",
      ".py", ".go", ".java", ".c", ".cpp", ".h", ".rs", ".php"
    ];

    let base = importPath;
    if (importPath.startsWith(".")) {
      base = path.posix.normalize(path.posix.join(path.posix.dirname(sourceFile), importPath));
    }

    const candidates = [
      ...EXTENSIONS.map((ext) => base + ext),
      ...EXTENSIONS.slice(1).map((ext) => path.posix.join(base, `index${ext}`)),
      ...EXTENSIONS.slice(1).map((ext) => path.posix.join(base, `mod${ext}`)),
      ...EXTENSIONS.slice(1).map((ext) => path.posix.join(base, `__init__${ext}`))
    ];

    // Direct match
    for (const cand of candidates) {
      if (fileSet.has(cand)) return cand;
    }

    // Basename/partial match fallback for languages like Go / Java / Python packages
    const normalizedTarget = importPath.replace(/\\/g, "/").split("/").pop();
    for (const file of fileSet) {
      const fileNameWithoutExt = path.posix.basename(file, path.posix.extname(file));
      if (fileNameWithoutExt === normalizedTarget) {
        return file;
      }
    }

    return null;
  }
}

