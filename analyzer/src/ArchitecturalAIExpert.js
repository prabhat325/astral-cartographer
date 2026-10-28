/**
 * ArchitecturalAIExpert — Provides AI-powered code explanation and
 * identifies architectural issues, code smells, coupling risks, and refactoring paths.
 */
export class ArchitecturalAIExpert {
  /**
   * Generate an architectural analysis and issue report for a file or code snippet.
   * @param {string} code
   * @param {string} filePath
   * @param {object} context
   */
  explainCode(code, filePath, context = {}) {
    const lines = (code || "").split(/\r?\n/);
    const loc = lines.length;
    const {
      cluster = "module",
      complexity = 1,
      inDegree = 0,
      outDegree = 0,
      blastRadius = 0,
      isGodFile = false,
      symbols = []
    } = context;

    // Detect purpose
    let purpose = `Serves as a ${cluster.toUpperCase()} module handling core application logic.`;
    if (cluster === "ui") {
      purpose = `User interface component responsible for rendering and interactive user flow in '${filePath}'.`;
    } else if (cluster === "api") {
      purpose = `API / Service layer module facilitating external communications or data access.`;
    } else if (cluster === "state") {
      purpose = `State management / store module maintaining reactive application state.`;
    } else if (cluster === "utils") {
      purpose = `Reusable utility module providing pure helper functions across the codebase.`;
    } else if (cluster === "config") {
      purpose = `Configuration and schema definitions governing application behavior and data types.`;
    }

    // Key responsibilities
    const responsibilities = [];
    if (symbols && symbols.length > 0) {
      const topSymbols = symbols.slice(0, 4).map((s) => `${s.type} \`${s.name}\``).join(", ");
      responsibilities.push(`Defines and orchestrates primary symbols: ${topSymbols}.`);
    } else {
      responsibilities.push(`Encapsulates module-level logic for ${filePath.split("/").pop()}.`);
    }

    if (outDegree > 0) {
      responsibilities.push(`Consumes and coordinates ${outDegree} external/internal dependencies.`);
    } else {
      responsibilities.push(`Functions as a pure leaf module with zero outgoing dependencies.`);
    }

    if (inDegree > 3) {
      responsibilities.push(`Acts as a central architectural foundation depended upon by ${inDegree} other files.`);
    }

    // Architectural Observations & Issues Identified
    const observations = [];
    if (isGodFile) {
      observations.push(`🚨 **God File Detected**: Extremely high afferent coupling (in-degree ${inDegree}) combined with complexity (${complexity}). High risk of regression when modified.`);
    }
    if (complexity > 12) {
      observations.push(`⚠️ **High Cyclomatic Complexity (${complexity})**: Branching logic exceeds standard threshold (10). Contains many nested conditional paths.`);
    }
    if (blastRadius > 5) {
      observations.push(`💥 **Large Blast Radius**: Changes to this file impact ${blastRadius} downstream files directly or transitively.`);
    }
    if (inDegree > 0 && outDegree > 5) {
      observations.push(`🔄 **High Efferent Coupling**: Module relies on ${outDegree} distinct dependencies, suggesting low cohesion.`);
    }
    if (observations.length === 0) {
      observations.push(`✅ **Clean Architectural Boundary**: Low coupling (in: ${inDegree}, out: ${outDegree}) and moderate complexity (${complexity}). Well-isolated.`);
    }

    // Actionable Recommendations
    const recommendations = [];
    if (isGodFile) {
      recommendations.push(`Split this God file by extracting sub-modules into dedicated domain services to reduce afferent coupling.`);
    }
    if (complexity > 10) {
      recommendations.push(`Refactor complex branching into strategy patterns or decompose large functions into smaller pure functions.`);
    }
    if (outDegree > 6) {
      recommendations.push(`Apply Dependency Inversion or introduce a facade to decrease the number of direct imports.`);
    }
    if (recommendations.length === 0) {
      recommendations.push(`Maintain current modular structure and write unit tests covering edge branches.`);
    }

    return [
      `**Purpose**: ${purpose}`,
      ``,
      `**Key Responsibilities**:`,
      ...responsibilities.map((r) => `- ${r}`),
      ``,
      `**Architectural Observations**:`,
      ...observations.map((o) => `- ${o}`),
      ``,
      `**Recommendations**:`,
      ...recommendations.map((rc) => `- ${rc}`)
    ].join("\n");
  }
}

