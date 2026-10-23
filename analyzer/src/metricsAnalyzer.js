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

/**
 * Calculates Lines of Code (LOC) breakdown:
 * total, code, comments, blanks
 */
export function calculateLoc(code) {
  const lines = code.split(/\r?\n/);
  let blank = 0;
  let comment = 0;
  let inBlockComment = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      blank++;
      continue;
    }

    if (inBlockComment) {
      comment++;
      if (trimmed.includes("*/")) {
        inBlockComment = false;
      }
      continue;
    }

    if (trimmed.startsWith("/*")) {
      comment++;
      if (!trimmed.includes("*/")) {
        inBlockComment = true;
      }
      continue;
    }

    if (trimmed.startsWith("//")) {
      comment++;
      continue;
    }
  }

  const total = lines.length;
  const codeLines = Math.max(0, total - blank - comment);

  return {
    total,
    code: codeLines,
    comment,
    blank
  };
}

/**
 * Calculates Token Count (lexical tokens for AST)
 */
export function estimateTokens(code) {
  // Matches identifiers, numbers, strings, operators, punctuation
  const tokenRegex = /[a-zA-Z_$][a-zA-Z0-9_$]*|[0-9]+(?:\.[0-9]+)?|"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|`[^`\\]*(?:\\.[^`\\]*)*`|=>|===|!==|==|!=|<=|>=|\+\+|--|\+=|-=|\*=|\/=|&&|\|\||\?\?|\?|:|\{|\}|\(|\)|\[|\]|;|,|\.|\S/g;
  const matches = code.match(tokenRegex);
  return matches ? matches.length : 0;
}

/**
 * Calculates Cyclomatic Complexity:
 * V(G) = E - N + 2P, equivalent to 1 + sum of decision points
 */
export function calculateCyclomaticComplexity(astOrCode, filePath = "file.js") {
  let ast;
  if (typeof astOrCode === "string") {
    try {
      ast = parse(astOrCode, {
        sourceType: "unambiguous",
        plugins: getParserPlugins(filePath),
        errorRecovery: true
      });
    } catch {
      return { fileComplexity: 1, functionComplexities: [] };
    }
  } else {
    ast = astOrCode;
  }

  let fileComplexity = 1;
  const functionComplexities = [];

  function isDecisionPoint(node) {
    if (!node || typeof node !== "object") return false;

    // Branches
    if (node.type === "IfStatement") return true;
    if (node.type === "ConditionalExpression") return true; // ternary

    // Loops
    if (
      node.type === "ForStatement" ||
      node.type === "ForInStatement" ||
      node.type === "ForOfStatement" ||
      node.type === "WhileStatement" ||
      node.type === "DoWhileStatement"
    ) {
      return true;
    }

    // Catch blocks
    if (node.type === "CatchClause") return true;

    // Switch cases (excluding default: case which has null test)
    if (node.type === "SwitchCase" && node.test !== null) return true;

    // Logical operators (&&, ||, ??)
    if (
      node.type === "LogicalExpression" &&
      ["&&", "||", "??"].includes(node.operator)
    ) {
      return true;
    }

    return false;
  }

  function traverse(node, currentFn = null) {
    if (!node || typeof node !== "object") return;

    if (Array.isArray(node)) {
      for (const item of node) {
        traverse(item, currentFn);
      }
      return;
    }

    let activeFn = currentFn;

    // If entering a function boundary
    const isFunction =
      node.type === "FunctionDeclaration" ||
      node.type === "FunctionExpression" ||
      node.type === "ArrowFunctionExpression" ||
      node.type === "ClassMethod";

    if (isFunction) {
      let fnName = "anonymous";
      if (node.id?.name) {
        fnName = node.id.name;
      } else if (node.key?.name) {
        fnName = node.key.name;
      }

      activeFn = {
        name: fnName,
        line: node.loc?.start.line ?? null,
        complexity: 1
      };
      functionComplexities.push(activeFn);
    }

    if (isDecisionPoint(node)) {
      fileComplexity++;
      if (activeFn) {
        activeFn.complexity++;
      }
    }

    for (const [key, value] of Object.entries(node)) {
      if (["loc", "start", "end", "comments"].includes(key)) continue;
      if (value && typeof value === "object") {
        traverse(value, activeFn);
      }
    }
  }

  traverse(ast.program);

  return {
    fileComplexity,
    functionComplexities
  };
}
