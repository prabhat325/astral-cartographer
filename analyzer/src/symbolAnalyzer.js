import { parse } from "@babel/parser";
import path from "node:path";

function getParserPlugins(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const plugins = ["jsx"];
  if ([".ts", ".tsx", ".mts", ".cts"].includes(ext)) {
    plugins.push("typescript");
  }
  return plugins;
}

export function analyzeSymbols(code, filePath) {
  const plugins = getParserPlugins(filePath);

  let ast;
  try {
    ast = parse(code, {
      sourceType: "unambiguous",
      plugins,
      errorRecovery: true
    });
  } catch {
    return [];
  }

  const symbols = [];

  function addSymbol({ name, type, line, endLine, isExported = false, params = [] }) {
    if (!name || name === "anonymous") return;
    symbols.push({
      id: `${filePath}::${name}`,
      name,
      type,
      file: filePath,
      line: line ?? null,
      endLine: endLine ?? null,
      isExported,
      paramsCount: params.length,
      params
    });
  }

  function getParamNames(paramsNode = []) {
    return paramsNode.map((p) => {
      if (p.type === "Identifier") return p.name;
      if (p.type === "AssignmentPattern" && p.left?.type === "Identifier") return p.left.name;
      if (p.type === "RestElement" && p.argument?.type === "Identifier") return `...${p.argument.name}`;
      return "param";
    });
  }

  function visit(node, isExportedContext = false) {
    if (!node || typeof node !== "object") return;

    if (Array.isArray(node)) {
      for (const item of node) visit(item, isExportedContext);
      return;
    }

    // Export wrappers
    if (node.type === "ExportNamedDeclaration" || node.type === "ExportDefaultDeclaration") {
      if (node.declaration) {
        visit(node.declaration, true);
        return;
      }
    }

    // Function Declaration: function foo() {}
    if (node.type === "FunctionDeclaration") {
      const name = node.id?.name;
      if (name) {
        addSymbol({
          name,
          type: "function",
          line: node.loc?.start.line,
          endLine: node.loc?.end.line,
          isExported: isExportedContext,
          params: getParamNames(node.params)
        });
      }
    }

    // Class Declaration: class Foo {}
    if (node.type === "ClassDeclaration") {
      const className = node.id?.name;
      if (className) {
        addSymbol({
          name: className,
          type: "class",
          line: node.loc?.start.line,
          endLine: node.loc?.end.line,
          isExported: isExportedContext
        });

        // Extract class methods
        for (const element of node.body?.body || []) {
          if (element.type === "ClassMethod" && element.key?.name) {
            addSymbol({
              name: `${className}.${element.key.name}`,
              type: "method",
              line: element.loc?.start.line,
              endLine: element.loc?.end.line,
              isExported: isExportedContext,
              params: getParamNames(element.params)
            });
          }
        }
      }
    }

    // Variable declaration functions: const foo = () => {} or const foo = function() {}
    if (node.type === "VariableDeclaration") {
      for (const decl of node.declarations || []) {
        if (decl.id?.type === "Identifier" && decl.init) {
          const varName = decl.id.name;
          const initType = decl.init.type;

          if (initType === "ArrowFunctionExpression" || initType === "FunctionExpression") {
            addSymbol({
              name: varName,
              type: "function",
              line: decl.loc?.start.line,
              endLine: decl.loc?.end.line,
              isExported: isExportedContext,
              params: getParamNames(decl.init.params)
            });
          }
        }
      }
    }

    // TypeScript Interface or Type Alias
    if (node.type === "TSInterfaceDeclaration" && node.id?.name) {
      addSymbol({
        name: node.id.name,
        type: "interface",
        line: node.loc?.start.line,
        endLine: node.loc?.end.line,
        isExported: isExportedContext
      });
    }

    if (node.type === "TSTypeAliasDeclaration" && node.id?.name) {
      addSymbol({
        name: node.id.name,
        type: "type",
        line: node.loc?.start.line,
        endLine: node.loc?.end.line,
        isExported: isExportedContext
      });
    }

    for (const [key, value] of Object.entries(node)) {
      if (["loc", "start", "end", "comments"].includes(key)) continue;
      if (value && typeof value === "object") {
        visit(value, false);
      }
    }
  }

  visit(ast.program);
  return symbols;
}
