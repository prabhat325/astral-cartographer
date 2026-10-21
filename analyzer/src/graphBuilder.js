
import path from "node:path";

const EXTENSIONS = [
  "", ".js", ".jsx", ".mjs", ".cjs",
  ".ts", ".tsx", ".mts", ".cts"
];

function resolveImport(sourceFile, importPath, fileSet) {
  if (!importPath.startsWith(".")) return null;

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

export function buildGraph(files, importsByFile, functionCalls = []) {
  const fileSet = new Set(files.map((file) => file.path));

  const nodes = files.map((file) => ({
    id: file.path,
    type: "file"
  }));

  const edges = [];

  for (const file of files) {
    for (const item of importsByFile[file.path] ?? []) {
      const target = resolveImport(file.path, item.source, fileSet);

      if (target) {
        edges.push({
          source: file.path,
          target,
          type: item.kind,
          line: item.line
        });
      }
    }
  }

  for (const call of functionCalls) {
    edges.push({
      source: `${call.file}::${call.caller}`,
      target: call.callee,
      type: "calls",
      line: call.line
    });
  }

  return { nodes, edges };
}
