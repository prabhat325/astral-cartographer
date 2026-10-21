
import { parse } from "@babel/parser";
import path from "node:path";

export function analyzeSymbols(code, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const plugins = ["jsx"];

  if ([".ts", ".tsx", ".mts", ".cts"].includes(ext)) {
    plugins.push("typescript");
  }

  const ast = parse(code, {
    sourceType: "unambiguous",
    plugins
  });

  const symbols = [];

  function visit(node) {
    if (!node || typeof node !== "object") return;

    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    if (
      node.type === "FunctionDeclaration" ||
      node.type === "ClassDeclaration"
    ) {
      const name = node.id?.name ?? "anonymous";

      symbols.push({
        id: `${filePath}::${name}`,
        name,
        type: node.type === "ClassDeclaration"
          ? "class"
          : "function",
        file: filePath,
        line: node.loc?.start.line ?? null
      });
    }

    for (const [key, value] of Object.entries(node)) {
      if (["loc", "start", "end", "comments"].includes(key)) continue;
      if (value && typeof value === "object") visit(value);
    }
  }

  visit(ast.program);
  return symbols;
}
