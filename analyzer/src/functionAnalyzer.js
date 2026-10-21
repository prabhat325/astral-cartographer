
import { parse } from "@babel/parser";
import path from "node:path";

export function analyzeFunctionCalls(code, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const plugins = ["jsx"];

  if ([".ts", ".tsx", ".mts", ".cts"].includes(ext)) {
    plugins.push("typescript");
  }

  const ast = parse(code, {
    sourceType: "unambiguous",
    plugins
  });

  const calls = [];

  function getName(node) {
    if (!node) return null;

    if (node.type === "Identifier") {
      return node.name;
    }

    if (
      node.type === "MemberExpression" &&
      !node.computed
    ) {
      const object = getName(node.object);
      const property = getName(node.property);

      return object && property
        ? `${object}.${property}`
        : null;
    }

    return null;
  }

  function visit(node, currentFunction = null) {
    if (!node || typeof node !== "object") return;

    if (Array.isArray(node)) {
      node.forEach((item) => visit(item, currentFunction));
      return;
    }

    let scope = currentFunction;

    if (
      node.type === "FunctionDeclaration" ||
      node.type === "FunctionExpression" ||
      node.type === "ArrowFunctionExpression"
    ) {
      scope =
        node.id?.name ??
        currentFunction ??
        "anonymous";
    }

    if (node.type === "CallExpression") {
      const callee = getName(node.callee);

      if (callee) {
        calls.push({
          file: filePath,
          caller: scope,
          callee,
          line: node.loc?.start.line ?? null
        });
      }
    }

    for (const [key, value] of Object.entries(node)) {
      if (["loc", "start", "end", "comments"].includes(key)) {
        continue;
      }

      if (value && typeof value === "object") {
        visit(value, scope);
      }
    }
  }

  visit(ast.program);

  return calls;
}
