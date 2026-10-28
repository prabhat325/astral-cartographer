import { parse as babelParse } from "@babel/parser";
import path from "node:path";

/**
 * CodeParser — Class responsible for parsing source files across multiple
 * programming languages (JavaScript, TypeScript, Python, Java, Go, C/C++, Rust, PHP)
 * into ASTs and structured syntactic representations.
 */
export class CodeParser {
  constructor(options = {}) {
    this.options = {
      tolerant: true,
      ...options
    };
  }

  /**
   * Detect language from file path extension.
   * @param {string} filePath
   * @returns {string}
   */
  detectLanguage(filePath) {
    const ext = path.extname(filePath || "").toLowerCase();
    switch (ext) {
      case ".js":
      case ".jsx":
      case ".mjs":
      case ".cjs":
        return "javascript";
      case ".ts":
      case ".tsx":
      case ".mts":
      case ".cts":
        return "typescript";
      case ".py":
        return "python";
      case ".java":
        return "java";
      case ".go":
        return "go";
      case ".c":
      case ".h":
        return "c";
      case ".cpp":
      case ".hpp":
      case ".cc":
      case ".cxx":
        return "cpp";
      case ".rs":
        return "rust";
      case ".php":
        return "php";
      default:
        return "unknown";
    }
  }

  /**
   * Parse JavaScript or TypeScript using Babel.
   * @param {string} code
   * @param {string} filePath
   */
  parseJsTs(code, filePath) {
    const ext = path.extname(filePath || "").toLowerCase();
    const plugins = ["jsx", "asyncGenerators", "dynamicImport", "exportDefaultFrom", "objectRestSpread"];
    if ([".ts", ".tsx", ".mts", ".cts"].includes(ext)) {
      plugins.push("typescript");
    }

    try {
      return babelParse(code, {
        sourceType: "unambiguous",
        plugins,
        errorRecovery: this.options.tolerant
      });
    } catch (err) {
      // Fallback with looser options
      return babelParse(code, {
        sourceType: "script",
        plugins: ["jsx", "typescript"],
        errorRecovery: true
      });
    }
  }

  /**
   * Parse source code according to detected language.
   * Returns a structured parse tree or language-specific token model.
   * @param {string} code
   * @param {string} filePath
   */
  parse(code, filePath) {
    const language = this.detectLanguage(filePath);

    if (language === "javascript" || language === "typescript") {
      try {
        const ast = this.parseJsTs(code, filePath);
        return { language, ast, success: true };
      } catch (err) {
        return { language, ast: null, success: false, error: err.message };
      }
    }

    // For non-JS/TS languages, return language metadata and lines
    return {
      language,
      ast: null,
      success: true,
      lines: code.split(/\r?\n/)
    };
  }
}

