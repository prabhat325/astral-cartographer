
import { parse } from "@babel/parser";
import path from "node:path";

export function analyzeImports(code, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const plugins = ["jsx"];

  if ([".ts", ".tsx", ".mts", ".cts"].includes(extension)) {
    plugins.push("typescript");
  }

  const ast = parse(code, {
    sourceType: "unambiguous",
    plugins
  });

  const imports = [];

  for (const node of ast.program.body) {
    if (
      node.type === "ImportDeclaration" ||
      node.type === "ExportNamedDeclaration" ||
      node.type === "ExportAllDeclaration"
    ) {
      if (node.source) {
        imports.push({
          source: node.source.value,
          kind: node.type === "ImportDeclaration"
            ? "import"
            : "re-export",
          line: node.loc?.start.line ?? null
        });
      }
    }
  }

  return imports;
}
