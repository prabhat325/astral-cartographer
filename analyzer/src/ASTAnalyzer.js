import path from "node:path";
import { CodeParser } from "./CodeParser.js";
import { analyzeSymbols as jsAnalyzeSymbols } from "./symbolAnalyzer.js";
import { analyzeImports as jsAnalyzeImports } from "./importAnalyzer.js";
import { analyzeFunctionCalls as jsAnalyzeFunctionCalls } from "./functionAnalyzer.js";
import {
  calculateLoc,
  estimateTokens,
  calculateCyclomaticComplexity as jsCalculateCC
} from "./metricsAnalyzer.js";

/**
 * ASTAnalyzer — Extracts functions, classes, imports, and code structures
 * from source files across multiple programming languages.
 */
export class ASTAnalyzer {
  constructor() {
    this.parser = new CodeParser();
  }

  /**
   * Analyze an individual source file and extract metrics, imports, symbols, and calls.
   * @param {string} code
   * @param {string} filePath
   */
  analyzeFile(code, filePath) {
    const language = this.parser.detectLanguage(filePath);
    const loc = calculateLoc(code);
    const tokenCount = estimateTokens(code);

    let imports = [];
    let symbols = [];
    let functionCalls = [];
    let complexity = 1;
    let functionComplexities = [];
    let error = null;

    try {
      if (language === "javascript" || language === "typescript") {
        // Use existing JS/TS Babel analyzers
        const ccResult = jsCalculateCC(code, filePath);
        complexity = ccResult.fileComplexity || 1;
        functionComplexities = ccResult.functionComplexities || [];

        imports = jsAnalyzeImports(code, filePath);
        symbols = jsAnalyzeSymbols(code, filePath);
        functionCalls = jsAnalyzeFunctionCalls(code, filePath);

        // Enrich symbols with complexity
        for (const sym of symbols) {
          const match = functionComplexities.find((fc) => fc.name === sym.name);
          if (match) sym.complexity = match.complexity;
        }
      } else {
        // Multi-language extraction for Python, Java, Go, C/C++, Rust, PHP
        const multi = this.analyzeMultiLanguage(code, filePath, language);
        imports = multi.imports;
        symbols = multi.symbols;
        functionCalls = multi.functionCalls;
        complexity = multi.complexity;
        functionComplexities = multi.functionComplexities;
      }
    } catch (err) {
      error = err.message;
      // Fallback to basic regex analysis on error so no file is completely lost
      const fallback = this.analyzeMultiLanguage(code, filePath, language);
      imports = imports.length ? imports : fallback.imports;
      symbols = symbols.length ? symbols : fallback.symbols;
      complexity = Math.max(1, fallback.complexity);
    }

    return {
      filePath,
      language,
      loc,
      tokenCount,
      complexity,
      functionComplexities,
      imports,
      symbols,
      functionCalls,
      error
    };
  }

  /**
   * Universal AST/Grammar analyzer for non-JS/TS languages.
   * @param {string} code
   * @param {string} filePath
   * @param {string} language
   */
  analyzeMultiLanguage(code, filePath, language) {
    const lines = code.split(/\r?\n/);
    const imports = [];
    const symbols = [];
    const functionCalls = [];
    const functionComplexities = [];
    let fileComplexity = 1;

    let currentClass = null;

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const raw = lines[i];
      const trimmed = raw.trim();

      if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
        continue;
      }

      // ── Cyclomatic Complexity decision points ──────────────────
      if (/\b(if|elif|else if|for|while|case|catch|except|switch)\b/.test(trimmed)) {
        fileComplexity++;
      }
      if (/&&|\|\||\band\b|\bor\b/.test(trimmed)) {
        fileComplexity++;
      }
      if (/\?.*:/.test(trimmed)) {
        fileComplexity++;
      }

      // ── Language-specific Import extraction ─────────────────────
      if (language === "python") {
        // e.g. import os, sys; from math import sqrt; from .sub import util
        const fromMatch = trimmed.match(/^from\s+([a-zA-Z0-9_.]+)\s+import\s+(.+)$/);
        const importMatch = trimmed.match(/^import\s+([a-zA-Z0-9_., ]+)$/);
        if (fromMatch) {
          const mod = fromMatch[1];
          const specifiers = fromMatch[2].split(",").map((s) => ({ imported: s.trim(), local: s.trim() }));
          imports.push({
            source: mod.startsWith(".") ? mod.replace(/\./g, "/") : mod,
            kind: "import",
            line: lineNum,
            isInternal: mod.startsWith("."),
            isDynamic: false,
            specifiers
          });
        } else if (importMatch) {
          const mods = importMatch[1].split(",");
          for (const m of mods) {
            const clean = m.trim().split(/\s+as\s+/)[0];
            imports.push({
              source: clean,
              kind: "import",
              line: lineNum,
              isInternal: false,
              isDynamic: false,
              specifiers: []
            });
          }
        }
      } else if (language === "java") {
        // e.g. import com.example.service.UserService;
        const jImport = trimmed.match(/^import\s+(?:static\s+)?([a-zA-Z0-9_.]+);/);
        if (jImport) {
          const source = jImport[1];
          imports.push({
            source,
            kind: "import",
            line: lineNum,
            isInternal: !source.startsWith("java.") && !source.startsWith("javax."),
            isDynamic: false,
            specifiers: [{ imported: source.split(".").pop(), local: source.split(".").pop() }]
          });
        }
      } else if (language === "go") {
        // e.g. import "fmt" or import ( "github.com/gin-gonic/gin" )
        const goImport = trimmed.match(/^import\s+"([^"]+)"/) || trimmed.match(/^"([^"]+)"/);
        if (goImport) {
          const source = goImport[1];
          imports.push({
            source,
            kind: "import",
            line: lineNum,
            isInternal: source.includes("/") || source.startsWith("."),
            isDynamic: false,
            specifiers: []
          });
        }
      } else if (language === "c" || language === "cpp") {
        // e.g. #include "my_header.h" or #include <vector>
        const incMatch = trimmed.match(/^#include\s+["<]([^">]+)[">]/);
        if (incMatch) {
          const source = incMatch[1];
          const isUserHeader = trimmed.includes('"');
          imports.push({
            source,
            kind: "include",
            line: lineNum,
            isInternal: isUserHeader,
            isDynamic: false,
            specifiers: []
          });
        }
      } else if (language === "rust") {
        // e.g. use crate::service::user; or mod auth;
        const rustUse = trimmed.match(/^use\s+([^;]+);/);
        const rustMod = trimmed.match(/^mod\s+([a-zA-Z0-9_]+);/);
        if (rustUse) {
          const source = rustUse[1].replace(/::/g, "/");
          imports.push({
            source,
            kind: "use",
            line: lineNum,
            isInternal: source.startsWith("crate") || source.startsWith("super"),
            isDynamic: false,
            specifiers: []
          });
        } else if (rustMod) {
          imports.push({
            source: `./${rustMod[1]}`,
            kind: "mod",
            line: lineNum,
            isInternal: true,
            isDynamic: false,
            specifiers: []
          });
        }
      } else if (language === "php") {
        // e.g. use App\Models\User; require 'db.php';
        const phpUse = trimmed.match(/^use\s+([^;]+);/);
        const phpReq = trimmed.match(/^(?:require|require_once|include|include_once)\s*\(?['"]([^'"]+)['"]\)?;/);
        if (phpUse) {
          imports.push({
            source: phpUse[1].replace(/\\/g, "/"),
            kind: "use",
            line: lineNum,
            isInternal: true,
            isDynamic: false,
            specifiers: []
          });
        } else if (phpReq) {
          imports.push({
            source: phpReq[1],
            kind: "require",
            line: lineNum,
            isInternal: true,
            isDynamic: false,
            specifiers: []
          });
        }
      }

      // ── Class / Struct extraction ──────────────────────────────
      let classMatch = null;
      if (language === "python") {
        classMatch = trimmed.match(/^class\s+([a-zA-Z0-9_]+)(?:\(([^)]*)\))?:/);
      } else if (language === "java" || language === "php") {
        classMatch = trimmed.match(/(?:public\s+|private\s+|protected\s+|abstract\s+)*(?:class|interface|trait|enum)\s+([a-zA-Z0-9_]+)(?:\s+extends\s+([a-zA-Z0-9_.]+))?/);
      } else if (language === "go") {
        classMatch = trimmed.match(/^type\s+([a-zA-Z0-9_]+)\s+(struct|interface)/);
      } else if (language === "c" || language === "cpp") {
        classMatch = trimmed.match(/(?:class|struct)\s+([a-zA-Z0-9_]+)(?:\s*:\s*(?:public\s+|private\s+)?([a-zA-Z0-9_]+))?\s*\{?/);
      } else if (language === "rust") {
        classMatch = trimmed.match(/(?:pub\s+)?(?:struct|enum|trait|impl)\s+([a-zA-Z0-9_]+)/);
      }

      if (classMatch) {
        const className = classMatch[1];
        currentClass = className;
        symbols.push({
          id: `${filePath}::${className}`,
          name: className,
          type: "class",
          file: filePath,
          line: lineNum,
          superClass: classMatch[2] ? classMatch[2].trim() : null,
          isExported: true,
          paramsCount: 0,
          params: [],
          complexity: 1
        });
      }

      // ── Function / Method extraction ────────────────────────────
      let funcMatch = null;
      let funcName = null;
      let params = [];

      if (language === "python") {
        funcMatch = trimmed.match(/^(?:async\s+)?def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\):/);
        if (funcMatch) {
          funcName = funcMatch[1];
          params = funcMatch[2] ? funcMatch[2].split(",").map((p) => p.trim()).filter(Boolean) : [];
        }
      } else if (language === "java") {
        funcMatch = trimmed.match(/(?:public|private|protected|static|final|\s)*\s+[\w<>[\]]+\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(?:throws\s+[\w\s,]+)?\s*\{/);
        if (funcMatch && !["if", "for", "while", "catch", "switch"].includes(funcMatch[1])) {
          funcName = funcMatch[1];
          params = funcMatch[2] ? funcMatch[2].split(",").map((p) => p.trim()).filter(Boolean) : [];
        }
      } else if (language === "go") {
        funcMatch = trimmed.match(/^func\s+(?:\((?:[^)]+)\)\s+)?([a-zA-Z0-9_]+)\s*\(([^)]*)\)/);
        if (funcMatch) {
          funcName = funcMatch[1];
          params = funcMatch[2] ? funcMatch[2].split(",").map((p) => p.trim()).filter(Boolean) : [];
        }
      } else if (language === "c" || language === "cpp") {
        funcMatch = trimmed.match(/(?:[\w:*&<>]+\s+)+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(?:const)?\s*\{/);
        if (funcMatch && !["if", "for", "while", "catch", "switch"].includes(funcMatch[1])) {
          funcName = funcMatch[1];
          params = funcMatch[2] ? funcMatch[2].split(",").map((p) => p.trim()).filter(Boolean) : [];
        }
      } else if (language === "rust") {
        funcMatch = trimmed.match(/(?:pub\s+)?(?:async\s+)?fn\s+([a-zA-Z0-9_]+)\s*(?:<[^>]+>)?\s*\(([^)]*)\)/);
        if (funcMatch) {
          funcName = funcMatch[1];
          params = funcMatch[2] ? funcMatch[2].split(",").map((p) => p.trim()).filter(Boolean) : [];
        }
      } else if (language === "php") {
        funcMatch = trimmed.match(/(?:public|private|protected|static|\s)*function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/);
        if (funcMatch) {
          funcName = funcMatch[1];
          params = funcMatch[2] ? funcMatch[2].split(",").map((p) => p.trim()).filter(Boolean) : [];
        }
      }

      if (funcName) {
        const symbolType = currentClass ? "method" : "function";
        const sym = {
          id: `${filePath}::${funcName}`,
          name: funcName,
          type: symbolType,
          file: filePath,
          line: lineNum,
          className: currentClass,
          isExported: true,
          paramsCount: params.length,
          params,
          complexity: 1
        };
        symbols.push(sym);
        functionComplexities.push({ name: funcName, complexity: 1, line: lineNum });
      }

      // ── Function calls extraction ───────────────────────────────
      const callMatches = trimmed.matchAll(/\b([a-zA-Z0-9_]{2,})\s*\(/g);
      for (const cm of callMatches) {
        const callee = cm[1];
        if (!["if", "for", "while", "catch", "switch", "def", "func", "fn", "function", "class", "return", "import"].includes(callee)) {
          functionCalls.push({
            file: filePath,
            caller: currentClass ? `${currentClass}` : "(module)",
            callee,
            line: lineNum
          });
        }
      }
    }

    return {
      imports,
      symbols,
      functionCalls,
      complexity: fileComplexity,
      functionComplexities
    };
  }
}

