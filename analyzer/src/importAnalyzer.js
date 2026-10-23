import { parse } from "@babel/parser";
import path from "node:path";

function getParserPlugins(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const plugins = ["jsx"];
  if ([".ts", ".tsx", ".mts", ".cts"].includes(extension)) {
    plugins.push("typescript");
  }
  return plugins;
}

export function analyzeImports(code, filePath) {
  const plugins = getParserPlugins(filePath);

  let ast;
  try {
    ast = parse(code, {
      sourceType: "unambiguous",
      plugins,
      errorRecovery: true
    });
  } catch (err) {
    throw new Error(`Failed to parse ${filePath}: ${err.message}`);
  }

  const imports = [];

  function addImport({ source, kind, line, specifiers = [], isDynamic = false }) {
    if (!source || typeof source !== "string") return;
    const isRelative = source.startsWith(".") || source.startsWith("/");
    const isAlias = source.startsWith("@/") || source.startsWith("~/");

    imports.push({
      source,
      kind,
      line: line ?? null,
      isInternal: isRelative || isAlias,
      isDynamic,
      specifiers
    });
  }

  // 1. Scan top-level program body for ES6 imports & exports
  for (const node of ast.program.body) {
    // ES6 Static Import: import foo, { bar } from './baz'
    if (node.type === "ImportDeclaration" && node.source) {
      const specifiers = (node.specifiers || []).map((spec) => {
        if (spec.type === "ImportDefaultSpecifier") {
          return { type: "default", local: spec.local?.name };
        }
        if (spec.type === "ImportNamespaceSpecifier") {
          return { type: "namespace", local: spec.local?.name };
        }
        return {
          type: "named",
          imported: spec.imported?.name || spec.imported?.value,
          local: spec.local?.name
        };
      });

      addImport({
        source: node.source.value,
        kind: "import",
        line: node.loc?.start.line,
        specifiers,
        isDynamic: false
      });
    }

    // Re-exports: export { x } from './y' or export * from './y'
    if (
      (node.type === "ExportNamedDeclaration" || node.type === "ExportAllDeclaration") &&
      node.source
    ) {
      addImport({
        source: node.source.value,
        kind: "re-export",
        line: node.loc?.start.line,
        specifiers: [],
        isDynamic: false
      });
    }
  }

  // 2. Deep traverse for dynamic import() and require()
  function traverse(node) {
    if (!node || typeof node !== "object") return;

    if (Array.isArray(node)) {
      for (const item of node) traverse(item);
      return;
    }

    // Dynamic import: import('./module')
    if (node.type === "Import" || (node.type === "CallExpression" && node.callee?.type === "Import")) {
      const arg = node.arguments?.[0];
      if (arg && (arg.type === "StringLiteral" || typeof arg.value === "string")) {
        addImport({
          source: arg.value,
          kind: "dynamic-import",
          line: node.loc?.start.line,
          isDynamic: true
        });
      }
    }

    // CommonJS: require('./module')
    if (
      node.type === "CallExpression" &&
      node.callee?.type === "Identifier" &&
      node.callee?.name === "require"
    ) {
      const arg = node.arguments?.[0];
      if (arg && (arg.type === "StringLiteral" || typeof arg.value === "string")) {
        addImport({
          source: arg.value,
          kind: "require",
          line: node.loc?.start.line,
          isDynamic: false
        });
      }
    }

    for (const [key, value] of Object.entries(node)) {
      if (["loc", "start", "end", "comments"].includes(key)) continue;
      if (value && typeof value === "object") {
        traverse(value);
      }
    }
  }

  traverse(ast.program);

  return imports;
}
